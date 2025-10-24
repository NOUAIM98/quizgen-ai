// api/src/routes/quiz.js
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// routes/quiz.js
import { ensureIndex } from "../src/utils/elastic.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/* --------------------------- Elasticsearch --------------------------- */
const esClient = new Client({
  node: process.env.ELASTIC_URL,
  auth: { apiKey: process.env.ELASTIC_API_KEY },
});

/* ---------------------------- Gemini init ---------------------------- */
// Force v1beta (your key lists models under v1beta; calling v1 will 404/Unknown resource)
function makeGenAI() {
  const apiKey =
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY_V1 ||
    "";

  if (!apiKey) {
    throw new Error("Missing Gemini API key. Set GOOGLE_API_KEY (or GEMINI_API_KEY).");
  }

  // IMPORTANT: v1beta endpoint
  return new GoogleGenerativeAI(apiKey, {
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta",
  });
}

// Return an array of candidate model names (short + 'models/...' variants) with dedupe
function candidateModels() {
  const preferred = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
  const addVariants = (name) =>
    name.startsWith("models/") ? [name, name.replace(/^models\//, "")] : [name, `models/${name}`];

  const out = new Set([
    ...addVariants(preferred),
    ...addVariants("gemini-2.5-flash"),
  ]);
  return [...out];
}

function stringifyErr(e) {
  return {
    name: e?.name,
    message: e?.message,
    status: e?.status,
    data: e?.response?.data ?? e?.error ?? null,
  };
}

/* -------------------------- Diagnostics: ping ------------------------ */
// Quick endpoint to verify the key/model on this revision.
router.get("/ping", async (_req, res) => {
  try {
    const genAI = makeGenAI();
    const candidates = candidateModels();
    let lastErr;
    for (const name of candidates) {
      try {
        const model = genAI.getGenerativeModel({ model: name });
        const r = await model.generateContent("ping");
        return res.json({ ok: true, model: name, text: r.response.text() });
      } catch (e) {
        lastErr = e;
      }
    }
    res.status(500).json({ ok: false, message: "All models failed", error: stringifyErr(lastErr) });
  } catch (e) {
    res.status(500).json({ ok: false, message: stringifyErr(e) });
  }
});

/* -------------------- ES helper: fetch text by docId ----------------- */
async function getDocTextById(docId, maxChars = 12000) {
  try {
    // primary: exact filter
    let res = await esClient.search({
      index: process.env.ELASTIC_INDEX,
      size: 1000,
      query: { bool: { filter: [{ term: { docId } }] } },
      sort: [{ page: { order: "asc" } }],
      _source: ["text"],
    });

    // fallback 1: match
    if (!res.hits?.hits?.length) {
      res = await esClient.search({
        index: process.env.ELASTIC_INDEX,
        size: 1000,
        query: { match: { docId } },
        sort: [{ page: { order: "asc" } }],
        _source: ["text"],
      });
    }

    // fallback 2: refresh + retry
    if (!res.hits?.hits?.length) {
      try { await esClient.indices.refresh({ index: process.env.ELASTIC_INDEX }); } catch {}
      res = await esClient.search({
        index: process.env.ELASTIC_INDEX,
        size: 1000,
        query: { bool: { filter: [{ term: { docId } }] } },
        sort: [{ page: { order: "asc" } }],
        _source: ["text"],
      });
    }

    const joined = (res.hits?.hits || []).map(h => h._source?.text || "").join("\n");
    return (joined || "").slice(0, maxChars);
  } catch (err) {
    console.error("❌ getDocTextById error:", err?.message || err);
    return "";
  }
}

/* --------------- LLM output helper: extract quiz JSON --------------- */
function extractQuizArray(raw) {
  if (!raw || typeof raw !== "string") return [];

  // strip ```json fences if any
  let text = raw.replace(/```json\s*([\s\S]*?)\s*```/gi, "$1").trim();

  // pick first [...] block
  const match = text.match(/\[[\s\S]*\]/);
  if (match) text = match[0];

  // normalize quotes/trailing commas
  text = text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1");

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* --------------------------- Generate quiz -------------------------- */
router.post("/generate", async (req, res) => {
  try {
    let { topic = "", docId = "", n = 10 } = req.body || {};
    n = Math.max(5, Math.min(30, Number(n) || 10));

    await ensureIndex();

    // Build context
    let context = "";
    if (docId?.trim()) {
      context = await getDocTextById(docId);
      console.log("🧠 docId:", docId);
      console.log("📏 context length:", context?.length || 0);
      console.log("🧾 preview:", (context || "").slice(0, 200));

      if (!context || context.replace(/\s/g, "").length < 20) {
        console.warn("⚠️ Empty/short context; falling back to topic/general.");
        context = topic?.trim()
          ? `Topic: ${topic.trim()}`
          : "General knowledge for education";
      }
    } else if (topic?.trim()) {
      context = `Topic: ${topic.trim()}`;
    } else {
      return res.status(400).json({ ok: false, message: "Provide either topic or document" });
    }

    const prompt = `
Return ONLY a valid JSON array like this:
[
  {
    "question": "string",
    "options": ["A","B","C","D","E"],
    "answer": "exact text of correct option",
    "explanation": "short reason"
  }
]
Rules:
- Exactly 5 distinct options per question.
- "answer" MUST be one of the options verbatim.
- Base questions on this content (use it carefully and accurately):
"""${context}"""
Generate ${n} multiple-choice questions.
`;

    // Gemini call with fallbacks
    const genAI = makeGenAI();
    const candidates = candidateModels();
    let text = "", lastErr;
    for (const name of candidates) {
      try {
        const m = genAI.getGenerativeModel({ model: name });
        const r = await m.generateContent(prompt);
        text = r?.response?.text?.() || "";
        if (text) { console.log("✅ used model:", name); break; }
      } catch (e) {
        lastErr = e;
      }
    }
    if (!text) {
      console.error("❌ Gemini error:", stringifyErr(lastErr));
      throw new Error("Gemini generation failed");
    }

    // Parse + normalize
    let quiz = extractQuizArray(text);
    quiz = quiz.map(q => {
      const five = Array.isArray(q?.options) && q.options.length >= 5
        ? q.options.slice(0, 5)
        : ["Option A", "Option B", "Option C", "Option D", "Option E"];

      let answer = q?.answer;
      if (!five.includes(answer)) answer = five[0];

      return {
        question: q?.question || "Untitled question",
        options: five,
        answer,
        explanation: q?.explanation || "No explanation provided.",
      };
    });

    if (!Array.isArray(quiz) || quiz.length === 0) {
      throw new Error("Empty quiz output");
    }

    // Store quiz
    await esClient.index({
      index: process.env.ELASTIC_INDEX,
      document: {
        topic: topic || `(doc:${docId || ""})`,
        docId: docId || null,
        quiz,
        createdAt: new Date().toISOString(),
      },
      refresh: "wait_for",
    });

    res.json({ ok: true, quiz, count: quiz.length });
  } catch (err) {
    console.error("❌ /api/quiz/generate:", stringifyErr(err) || err);
    res.status(500).json({ ok: false, message: err?.message || "Quiz generation failed" });
  }
});

export default router;
