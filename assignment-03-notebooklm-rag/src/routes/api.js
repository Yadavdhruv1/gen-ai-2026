/**
 * api.js — Express API Routes
 *
 * POST /api/upload   — Upload & index a document (PDF or TXT)
 * POST /api/chat     — Ask a question about the uploaded document
 */

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { loadAndChunkPDF, loadAndChunkText } from "../rag/ingest.js";
import { indexDocuments, collectionName } from "../rag/store.js";
import { generateAnswer } from "../rag/generate.js";

const router = Router();

// --- Multer setup for file uploads ---
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
    cb(null, unique + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".pdf", ".txt"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and TXT files are supported."));
    }
  },
});

// ──────────────────────────────────────────────
// POST /api/upload
// ──────────────────────────────────────────────
router.post("/upload", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const collection = collectionName(req.file.originalname);

    let chunks;

    if (ext === ".pdf") {
      chunks = await loadAndChunkPDF(filePath);
    } else {
      // .txt
      const text = fs.readFileSync(filePath, "utf-8");
      chunks = await loadAndChunkText(text, req.file.originalname);
    }

    // Index chunks into Qdrant
    await indexDocuments(chunks, collection);

    // Cleanup uploaded file from disk
    fs.unlinkSync(filePath);

    return res.json({
      success: true,
      collection,
      totalChunks: chunks.length,
      message: `Document indexed successfully into ${chunks.length} chunks.`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: err.message || "Upload failed." });
  }
});

// ──────────────────────────────────────────────
// POST /api/chat
// ──────────────────────────────────────────────
router.post("/chat", async (req, res) => {
  try {
    const { query, collection, history } = req.body;

    if (!query || !collection) {
      return res
        .status(400)
        .json({ error: "Both 'query' and 'collection' are required." });
    }

    const { answer, sources } = await generateAnswer(
      query,
      collection,
      history || []
    );

    return res.json({ answer, sources });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: err.message || "Chat failed." });
  }
});

export default router;
