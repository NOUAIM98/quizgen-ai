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

// --- Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTIC_URL,
  auth: { apiKey: process.env.ELASTIC_API_KEY },
});

// --- Gemini model
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- Helper: get full text by docId
async function getDocTextById(docId, maxChars = 8000) {
  try {
    const { hits } = await esClient.search({
      index: process.env.ELASTIC_INDEX,
      size: 1000,
      query: { term: { docId } },
      sort: [{ page: "asc" }],
      _source: ["text"],
    });
    const full = hits.hits.map(h => h._source?.text || "").join("\n");
    return full.slice(0, maxChars);
  } catch (err) {
    console.error("❌ getDocTextById error:", err.message);
    return "";
  }
}

// --- Main Quiz Route
router.post("/generate", async (req, res) => {
  try {
    let { topic = "", docId = "", n = 10 } = req.body || {};
    n = Math.max(5, Math.min(30, Number(n) || 10));

    await ensureIndex();

    let context = "";

    // Case 1: generate from uploaded document
    if (docId) {
      context = await getDocTextById(docId);

      // 👇 Added debug logs here
      console.log("🧠 Received docId:", docId);
      console.log("📏 Extracted context length:", context ? context.length : "undefined");
      console.log("🧾 First 200 chars of context:", context?.slice(0, 200));

      if (!context || context.length < 20) {
        return res.status(400).json({ ok: false, message: "Document too short or empty" });
      }
    }

    // Case 2: generate from manual topic
    else if (topic && topic.trim().length > 0) {
      context = `Topic: ${topic}`;
    }

    // Case 3: missing both
    else {
      return res.status(400).json({ ok: false, message: "Provide either topic or document" });
    }

    // --- Build prompt for Gemini
    const prompt = `
Return ONLY a JSON array in this format:
[
  {"question":"?","options":["A","B","C","D"],"answer":"A","explanation":"short reason"}
]
Generate ${n} clear and useful multiple-choice questions based on:
"""${context}"""
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const quiz = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    if (!Array.isArray(quiz) || quiz.length === 0) {
      throw new Error("Empty quiz output");
    }

    // Save in Elasticsearch
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
    res.status(500).json({ ok: false, message: err.message });
  }
});


export default router;
