/**
 * store.js — Qdrant Vector Store Module
 *
 * Handles indexing documents into Qdrant Cloud and connecting
 * to existing collections for retrieval.
 */

import { QdrantVectorStore } from "@langchain/qdrant";
import { getEmbeddings } from "./embeddings.js";

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

/**
 * Derive a safe Qdrant collection name from a filename.
 * Qdrant collection names allow alphanumerics, hyphens, and underscores.
 * @param {string} fileName
 * @returns {string}
 */
export function collectionName(fileName) {
  return fileName
    .replace(/\.[^/.]+$/, "")          // strip extension
    .replace(/[^a-zA-Z0-9_-]/g, "_")   // replace unsafe chars
    .substring(0, 60)                   // keep it reasonable
    .toLowerCase();
}

/**
 * Index an array of chunked documents into Qdrant.
 * Creates a new collection (or overwrites if it exists).
 * @param {import("langchain/schema").Document[]} chunks
 * @param {string} collection
 */
export async function indexDocuments(chunks, collection) {
  const embeddings = getEmbeddings();

  await QdrantVectorStore.fromDocuments(chunks, embeddings, {
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
    collectionName: collection,
  });
}

/**
 * Get a retriever from an existing Qdrant collection.
 * @param {string} collection
 * @param {number} [k=4] — Number of top results to retrieve.
 * @returns {Promise<import("langchain/schema/retriever").BaseRetriever>}
 */
export async function getRetriever(collection, k = 4) {
  const embeddings = getEmbeddings();

  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: QDRANT_URL,
      apiKey: QDRANT_API_KEY,
      collectionName: collection,
    }
  );

  return vectorStore.asRetriever({ k });
}
