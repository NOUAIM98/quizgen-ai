import express from "express";
import { generateText } from "../src/utils/vertex.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  const reply = await generateText(prompt);
  res.json({ reply });
});

export default router;
