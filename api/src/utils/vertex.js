import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// ===== Text Embedding (for Elasticsearch) =====
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
export async function embedText(text) {
  const result = await embedModel.embedContent(text);
  return result.embedding.values;
}

// ===== Text Generation (for ask route or general prompts) =====
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
export async function generateText(prompt) {
  const result = await chatModel.generateContent(prompt);
  return result.response.text();
}
