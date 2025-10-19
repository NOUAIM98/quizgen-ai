// api/routes/quiz.js
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ensureIndex } from "../utils/elastic.js"; // keep same utils path if needed

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ---- Elastic client
const es = new Client({
  node: process.env.ELASTIC_URL,
  auth: { apiKey: process.env.ELASTIC_API_KEY },
});
const ES_INDEX = process.env.ELASTIC_INDEX || "quizgen";

// ---- Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro" });

// ---- helper to gather text by docId
async function getDocTextById(docId, maxChars = 8000) {
  if (!docId) return "";
  const { hits } = await es.search({
    index: ES_INDEX,
    size: 1000,
    query: { term: { docId } },
    sort: [{ page: "asc" }],
    _source: ["text"],
  });
  const fullText = hits.hits.map(h => h._source?.text || "").join("\n");
  return fullText.slice(0, maxChars);
}

// ---- /api/quiz/generate
router.post("/generate", async (req, res) => {
  try {
    let { topic = "", docId = "", n = 10 } = req.body || {};
    n = Math.max(5, Math.min(30, Number(n) || 10));

    if (!topic && !docId) {
      return res.status(400).json({ ok: false, error: "Provide topic or docId" });
    }

    await ensureIndex();

    const context = docId
      ? await getDocTextById(docId)
      : `Topic: ${topic}`;

    const prompt = `
Return ONLY valid JSON array. No explanations.
Schema:
[
  {"question": "?", "options": ["A","B","C","D"], "answer": "A|B|C|D", "explanation": "one line"}
]
Rules:
- Create ${n} MCQs.
- Use only this context if available.
- Make questions distinct and not too trivial.
Context:
"""${context}"""
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // extract JSON safely
    const match = text.match(/\[[\s\S]*\]/);
    const quiz = match ? JSON.parse(match[0]) : [];

    // store in Elastic
    await es.index({
      index: ES_INDEX,
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
    console.error("❌ /quiz/generate:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
