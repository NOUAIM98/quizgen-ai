// api/src/utils/ai.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_ID = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const API_KEY  = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY in environment.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Generate text using Gemini.
 * Adjust the prompt to your quiz format as needed.
 */
export async function generateQuestions({ topic = "", n = 5, docId = "" }) {
  const model = genAI.getGenerativeModel({ model: MODEL_ID });

  // Simple prompt — replace with your existing prompt logic if you have one
  const prompt = docId
    ? `Create ${n} multiple-choice questions based ONLY on this document id "${docId}".`
    : `Create ${n} multiple-choice questions about "${topic}".`;

  try {
    const resp = await model.generateContent(prompt);
    const text = resp.response?.text?.() ?? "";
    return text; // Return raw text; your router can parse if needed
  } catch (err) {
    // Surface the real Gemini error to logs (very important for debugging)
    // eslint-disable-next-line no-console
    console.error("Gemini error:", err?.response?.data || err?.message || err);
    throw err;
  }
}
