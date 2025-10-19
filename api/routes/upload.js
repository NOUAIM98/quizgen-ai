// api/routes/upload.js
import express from "express";
import multer from "multer";
import crypto from "crypto";
import { Client } from "@elastic/elasticsearch";
import { createRequire } from "module";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);

// ===== Elasticsearch =====
const ES_INDEX = process.env.ELASTIC_INDEX;
const es = new Client({
  node: process.env.ELASTIC_URL,
  auth: { apiKey: process.env.ELASTIC_API_KEY },
});

async function ensureIndex() {
  try {
    const exists = await es.indices.exists({ index: ES_INDEX });
    if (!exists) {
      await es.indices.create({
        index: ES_INDEX,
        settings: { number_of_shards: 1, number_of_replicas: 0 },
        mappings: {
          properties: {
            docId: { type: "keyword" },
            title: { type: "text" },
            page: { type: "integer" },
            text: { type: "text" },
            createdAt: { type: "date" },
          },
        },
      });
    }
  } catch (e) {
    console.warn("[ensureIndex]", e.message);
  }
}

// ===== pdfjs loader (robust across installs) =====
async function loadPdfjs() {
  const candidates = [
    "pdfjs-dist/legacy/build/pdf.mjs",
    "pdfjs-dist/build/pdf.mjs",
    "pdfjs-dist/legacy/build/pdf.js",
    "pdfjs-dist/build/pdf.js",
  ];
  let lastErr;
  for (const p of candidates) {
    try {
      const resolved = require.resolve(p);
      return await import(pathToFileURL(resolved).href);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`pdfjs-dist not found (${lastErr?.message || "unknown"})`);
}

// ===== Text extraction via pdfjs =====
async function extractPdfText(buffer) {
  const pdfjs = await loadPdfjs();
  const getDocument = pdfjs.getDocument || pdfjs.default?.getDocument;
  if (!getDocument) throw new Error("getDocument not found in pdfjs-dist");

  // Ensure Uint8Array (pdfjs requires typed array)
  let arrBuf = buffer;
  if (buffer instanceof Buffer) arrBuf = new Uint8Array(buffer).buffer;
  const data = new Uint8Array(arrBuf);

  const doc = await getDocument({ data }).promise;
  let out = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const text = content.items.map((i) => i.str).join(" ").trim();
    if (text) out += text + "\n";
  }
  return out.trim();
}

// ===== Helpers =====
function chunkText(t, size = 1200) {
  const arr = [];
  for (let i = 0; i < t.length; i += size) arr.push(t.slice(i, i + size));
  return arr;
}

// ===== Router =====
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

/**
 * POST /api/upload
 * Form-data: file
 * Returns: { ok, docId, title, chunksIndexed, textLen }
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: "no_file" });
    }

    const title = req.file.originalname || "document.pdf";
    const docId = crypto.randomUUID();

    let text = "";
    try {
      text = await extractPdfText(req.file.buffer);
    } catch (e) {
      return res
        .status(400)
        .json({ ok: false, message: "PDF extraction failed: " + e.message });
    }

    if (!text) {
      return res
        .status(400)
        .json({ ok: false, message: "No text found in PDF" });
    }

    const chunks = chunkText(text);
    await ensureIndex();

    // Parallel indexing for speed
    await Promise.all(
      chunks.map((snippet, i) =>
        es.index({
          index: ES_INDEX,
          document: {
            docId,
            title,
            page: i + 1,
            text: snippet,
            createdAt: new Date().toISOString(),
          },
          refresh: false,
        })
      )
    );

    await es.indices.refresh({ index: ES_INDEX });

    return res.json({
      ok: true,
      docId,
      title,
      chunksIndexed: chunks.length,
      textLen: text.length,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return res.status(500).json({ ok: false, message: "upload_failed" });
  }
});

export default router;
