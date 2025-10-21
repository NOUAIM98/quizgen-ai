import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ensureIndex } from "../src/utils/elastic.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ES client
const esClient = new Client({
  node: process.env.ELASTIC_URL,
  auth: { apiKey: process.env.ELASTIC_API_KEY },
});

// Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Read concatenated text for docId with robust fallbacks.
 * - use filter/term (safer) and retry with match if needed
 * - ensures we don't fail just because ES didn’t refresh yet or mapping is off
 */
async function getDocTextById(docId, maxChars = 8000) {
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

    // fallback 2: force a refresh then retry primary
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
    return joined.slice(0, maxChars);
  } catch (err) {
    console.error("❌ getDocTextById error:", err.message);
    return "";
  }
}

router.post("/generate", async (req, res) => {
  try {
    let { topic = "", docId = "", n = 10 } = req.body || {};
    n = Math.max(5, Math.min(30, Number(n) || 10));

    await ensureIndex();

    // ===== Build context =====
    let context = "";
    if (docId) {
      context = await getDocTextById(docId);
      console.log("🧠 docId:", docId);
      console.log("📏 context length:", context?.length || 0);
      console.log("🧾 preview:", (context || "").slice(0, 200));

      // 👇 Do NOT hard fail; gracefully fall back to topic/general prompt
      if (!context || context.replace(/\s/g, "").length < 20) {
        console.warn("⚠️ Empty/short context for docId. Falling back to topic/general.");
        context = topic?.trim()?.length ? `Topic: ${topic.trim()}` : "General knowledge for education";
      }
    } else if (topic && topic.trim().length > 0) {
      context = `Topic: ${topic.trim()}`;
    } else {
      return res.status(400).json({ ok: false, message: "Provide either topic or document" });
    }

    // ===== Prompt (forces 5 options) =====
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
- Base questions on this content:
"""${context}"""
Generate ${n} multiple-choice questions.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    let quiz = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    // Normalize to guarantee 5 options
    quiz = quiz.map(q => ({
      question: q?.question || "Untitled question",
      options: Array.isArray(q?.options) && q.options.length >= 5
        ? q.options.slice(0,5)
        : ["Option A", "Option B", "Option C", "Option D", "Option E"],
      answer: (q?.answer && Array.isArray(q?.options) && q.options.includes(q.answer))
        ? q.answer
        : (Array.isArray(q?.options) ? q.options[0] : "Option A"),
      explanation: q?.explanation || "No explanation provided."
    }));

    if (!Array.isArray(quiz) || quiz.length === 0) {
      throw new Error("Empty quiz output");
    }

    // store quiz
    await esClient.index({
      index: process.env.ELASTIC_INDEX,
      document: {
        topic: topic || `(doc:${docId})`,
        docId: docId || null,
        quiz,
        createdAt: new Date().toISOString(),
      },
      refresh: "wait_for",
    });

    res.json({ ok: true, quiz, count: quiz.length });
  } catch (err) {
    console.error("❌ /quiz/generate:", err.message);
    res.status(500).json({ ok: false, message: err.message || "Quiz generation failed" });
  }
});

export default router;
