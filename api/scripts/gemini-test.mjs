import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Get API key
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error("❌ Missing GOOGLE_API_KEY in .env");

// Initialize Gemini 2.5 Flash
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

console.log("[gemini-test] Sending prompt...");

try {
  const result = await model.generateContent("Hello from QuizGen-AI using Gemini 2.5 Flash!");
  console.log("✅ Gemini replied:", result.response.text());
} catch (err) {
  console.error("❌ Gemini Error:", err);
}
