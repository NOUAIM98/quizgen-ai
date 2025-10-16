import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ensureIndex } from "../src/utils/elastic.js";

const router = express.Router();

// ===== Load Environment =====
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ===== Elastic Client =====
const esClient = new Client({
  node: process.env.ELASTIC_URL,
  auth: { apiKey: process.env.ELASTIC_API_KEY },
});

// ===== Gemini Client =====
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ===== Route: Generate & Save Quiz =====
router.post("/generate", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: "Topic is required" });

    console.log(`[quiz-gen] Generating quiz for topic: ${topic}`);

    // ✅ Ensure Elasticsearch index exists before saving
    await ensureIndex();

    const prompt = `
      Generate 5 multiple-choice questions about "${topic}".
      Each question should have 4 options and 1 correct answer.
      Return only JSON in this format:
      [
        {"question": "What is ...?", "options": ["A", "B", "C", "D"], "answer": "B"}
      ]
    `;

    // ===== Call Gemini =====
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // ===== Safe JSON Parsing =====
    let quizData;
    try {
      quizData = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\[.*\]/s);
      quizData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    // ===== Save to Elastic =====
    await esClient.index({
      index: process.env.ELASTIC_INDEX,
      document: {
        topic,
        quiz: quizData,
        createdAt: new Date().toISOString(),
      },
      refresh: "wait_for", // ✅ ensures data is searchable immediately
    });

    res.json({ success: true, quiz: quizData });
  } catch (err) {
    console.error("❌ [Error] /quiz/generate:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
