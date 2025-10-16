import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pino from "pino";
import pinoHttp from "pino-http";

// 🧩 Import routes
import askRouter from "../routes/ask.js";
import quizRouter from "../routes/quiz.js";
import uploadRouter from "../routes/upload.js";

// 🧩 Import Elasticsearch setup
import { ensureIndex } from "./utils/elastic.js";

// 🧩 Load environment variables
dotenv.config();

// 🧩 Logger setup
const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});

const app = express();

// 🧩 Middleware
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "1mb" }));

// ✅ Fix CORS issue for frontend (Vite @5173)
app.use(
  cors({
    origin: "http://localhost:5173", // must match your frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Handle preflight requests (important!)
app.options("*", cors());

// 🧩 Initialize Elasticsearch index
ensureIndex()
  .then(() => logger.info("✅ Elasticsearch index verified"))
  .catch((err) => logger.error("❌ Failed to ensure index:", err));

// 🧩 Health check route
app.get("/", (_req, res) => {
  res.json({ message: "QuizGen AI backend running" });
});

// 🧩 Simple test route
app.get("/quiz/test", (_req, res) => {
  res.json({ status: "ok", message: "Quiz test endpoint working!" });
});

// 🧩 API routes
app.use("/ask", askRouter);
app.use("/quiz", quizRouter);
app.use("/upload", uploadRouter);

// 🧩 Global error handler
app.use((err, req, res, _next) => {
  req.log?.error?.(err);
  const code = err.status || 500;
  res.status(code).json({
    error: code === 500 ? "Internal Server Error" : err.message,
  });
});

// 🧩 Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`⚡ QuizGen AI backend running at http://localhost:${PORT}`);
});
