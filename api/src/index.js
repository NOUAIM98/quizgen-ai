import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pino from "pino";
import pinoHttp from "pino-http";
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

/* -------------------------------------------------------
   CORS — single, strict allow-list
------------------------------------------------------- */
const allowlist = (
  process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || ""
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// keep locals for dev
for (const d of ["http://localhost:5173", "http://localhost:3000"]) {
  if (!allowlist.includes(d)) allowlist.push(d);
}

const corsOptions = {
  origin: (origin, cb) => {
    // allow non-browser clients (no Origin) like curl/health checks
    if (!origin) return cb(null, true);
    if (allowlist.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // cache preflight for 1 day
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* -------------------------------------------------------
   Core middleware
------------------------------------------------------- */
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: "1mb" }));

/* -------------------------------------------------------
   Startup checks
------------------------------------------------------- */
ensureIndex()
  .then(() => logger.info("✅ Elasticsearch index verified"))
  .catch((err) => logger.error("❌ Failed to ensure index:", err));

/* -------------------------------------------------------
   Health
------------------------------------------------------- */
app.get("/api/healthz", (_req, res) => res.json({ ok: true }));
app.get("/", (_req, res) => {
  res.json({ message: "QuizGen AI backend running" });
});
app.get("/quiz/test", (_req, res) => {
  res.json({ status: "ok", message: "Quiz test endpoint working!" });
});

/* -------------------------------------------------------
   Routes
------------------------------------------------------- */
app.use("/api/ask", askRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/upload", uploadRouter);

/* -------------------------------------------------------
   Error handler
------------------------------------------------------- */
app.use((err, req, res, _next) => {
  req.log?.error?.(err);
  const code = err.status || 500;
  res.status(code).json({
    error: code === 500 ? "Internal Server Error" : err.message,
  });
});

/* -------------------------------------------------------
   Start server
------------------------------------------------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`⚡ QuizGen AI backend running on ${PORT}`);
}); 
