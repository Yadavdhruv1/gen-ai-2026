/**
 * server.js — Express Application Entry Point
 *
 * Serves the static frontend and mounts the API routes.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./src/routes/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// --- Serve static frontend ---
app.use(express.static(path.join(__dirname, "public")));

// --- API routes ---
app.use("/api", apiRoutes);

// --- SPA fallback ---
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`\n🚀  NotebookLM RAG server running at http://localhost:${PORT}\n`);
});
