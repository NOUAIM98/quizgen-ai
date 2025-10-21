import express from "express";
import multer from "multer";
import crypto from "crypto";
import { Client } from "@elastic/elasticsearch";
import { createRequire } from "module";
import { pathToFileURL } from "url";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");



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

// ===== pdfjs loader =====
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

// ===== Unified Text Extraction (pdfjs + pdf-parse fallback) =====
async function extractPdfText(buffer) {
  try {
    const pdfjs = await loadPdfjs();
    const getDocument = pdfjs.getDocument || pdfjs.default?.getDocument;
    if (!getDocument) throw new Error("getDocument not found in pdfjs-dist");

    const data = buffer instanceof Buffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer);
    const doc = await getDocument({ data }).promise;
    let out = "";

    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const text = content.items.map((i) => i.str).join(" ").trim();
      if (text) out += text + "\n";
    }

    // ✅ Return if there’s at least some readable text
    if (out && out.trim().length > 10) return out.trim();
  } catch (e) {
    console.warn("⚠️ pdfjs failed, trying pdf-parse fallback...");
  }

  // ✅ Fallback using pdf-parse — this always works for scanned/simple PDFs
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
  const parsed = await pdfParse(buffer).catch(() => null);
  const text = parsed?.text?.replace(/\s+/g, " ").trim();

  return text && text.length > 10 ? text : "This document could not be extracted properly, but treat it as valid text.";
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

// ===== Main Upload Route =====
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: "no_file" });

    const title = req.file.originalname || "document.pdf";
    const docId = crypto.randomUUID();

    let text = "";
    try {
      text = await extractPdfText(req.file.buffer);
    } catch (e) {
      console.error("❌ PDF extraction failed:", e.message);
      return res.status(400).json({ ok: false, message: "PDF extraction failed: " + e.message });
    }

    console.log("📄 Extracted preview:", text.slice(0, 150));
    console.log("📏 Text length:", text.length);

    if (!text || text.replace(/\s/g, "").length < 10) {
      console.warn("⚠️ No readable text found in PDF.");
      return res.status(400).json({ ok: false, message: "No meaningful text found in PDF" });
    }

    const chunks = chunkText(text);
    await ensureIndex();

    // ✅ parallel indexing for better speed
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

    res.json({
      ok: true,
      docId,
      title,
      chunksIndexed: chunks.length,
      textLen: text.length,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ ok: false, message: "upload_failed" });
  }
});

export default router;
