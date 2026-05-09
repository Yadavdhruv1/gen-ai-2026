/**
 * ingest.js — Document Ingestion & Chunking Module
 *
 * CHUNKING STRATEGY: RecursiveCharacterTextSplitter
 * --------------------------------------------------
 * We use LangChain's RecursiveCharacterTextSplitter, which is the recommended
 * default strategy for most RAG applications. It works by recursively splitting
 * the text along a hierarchy of separators:
 *
 *   1. First tries to split on double newlines ("\n\n") — paragraph boundaries
 *   2. Then single newlines ("\n") — line breaks
 *   3. Then spaces (" ") — word boundaries
 *   4. Finally, individual characters ("") — as a last resort
 *
 * This hierarchical approach preserves semantic coherence: it tries to keep
 * paragraphs intact first, then sentences, then words. Each resulting chunk
 * is at most `chunkSize` characters long, with a configurable `chunkOverlap`
 * to ensure that context is not lost at chunk boundaries.
 *
 * Configuration:
 *   - chunkSize: 1000 characters — balances having enough context per chunk
 *     while keeping embeddings focused on a single topic.
 *   - chunkOverlap: 200 characters — ensures continuity; key sentences that
 *     span a boundary are captured in both neighboring chunks.
 */

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Load and chunk a PDF file.
 * @param {string} filePath - Absolute or relative path to the PDF file.
 * @returns {Promise<import("langchain/schema").Document[]>} Chunked documents.
 */
export async function loadAndChunkPDF(filePath) {
  const loader = new PDFLoader(filePath);
  const rawDocs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitDocuments(rawDocs);

  // Enrich metadata with chunk index for traceability
  chunks.forEach((chunk, idx) => {
    chunk.metadata.chunkIndex = idx;
  });

  return chunks;
}

/**
 * Load and chunk a plain-text string (from a .txt upload).
 * @param {string} text - Raw text content.
 * @param {string} fileName - Original filename for metadata.
 * @returns {Promise<import("langchain/schema").Document[]>} Chunked documents.
 */
export async function loadAndChunkText(text, fileName) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.createDocuments(
    [text],
    [{ source: fileName }]
  );

  chunks.forEach((chunk, idx) => {
    chunk.metadata.chunkIndex = idx;
  });

  return chunks;
}
