import express from "express";
import multer from "multer";
import { z } from "zod";
import { parsePdfBuffer, chunkText } from "../src/utils/pdfParser.js";
import { embedText } from "../src/utils/vertex.js";
import { es, ES_INDEX, ensureIndex } from "../src/utils/elastic.js";

const router = express.Router();

// ✅ Multer setup for in-memory PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || 20) * 1024 * 1024 },
});

// ✅ Validation schema
const MetaSchema = z.object({
  title: z.string().min(1),
  docId: z.string().min(1),
});

// ✅ POST /upload (multipart/form-data: file, title, docId)
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    await ensureIndex();

    // validate metadata
    const meta = MetaSchema.safeParse(req.body);
    if (!meta.success) {
      return res.status(400).json({ error: "Invalid metadata" });
    }

    // validate file
    if (!req.file || req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are accepted" });
    }

    // extract text + chunk it
    const text = await parsePdfBuffer(req.file.buffer);
    const chunks = chunkText(text);

    // index chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      const snippet = chunks[i];
      if (!snippet || snippet.length < 40) continue;

      const embedding = await embedText(snippet);

      await es.index({
        index: ES_INDEX,
        document: {
          text: snippet,
          title: meta.data.title,
          docId: meta.data.docId,
          page: i + 1,
          embedding,
        },
      });
    }

    res.json({ ok: true, chunksIndexed: chunks.length });
  } catch (err) {
    console.error("❌ Upload error:", err);
    next(err);
  }
});

export default router;
