/**
 * embeddings.js — Google Gemini Embeddings (LangChain-compatible)
 *
 * Uses Google's gemini-embedding-001 model via direct REST API calls.
 * Produces 3072-dimensional vectors. Completely FREE.
 */

import { Embeddings } from "@langchain/core/embeddings";

const EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

class GeminiEmbeddings extends Embeddings {
  constructor() {
    super({});
    this.apiKey = process.env.GOOGLE_API_KEY;
    if (!this.apiKey) {
      throw new Error("GOOGLE_API_KEY is not set in environment variables.");
    }
  }

  /**
   * Embed a single text via the Gemini REST API.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async _embed(text) {
    const res = await fetch(`${EMBED_URL}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text }] },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini Embedding API error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    return data.embedding.values;
  }

  /**
   * Embed a list of texts (used during document indexing).
   * @param {string[]} texts
   * @returns {Promise<number[][]>}
   */
  async embedDocuments(texts) {
    const results = [];
    // Process in batches of 10 with a small delay to respect rate limits
    for (let i = 0; i < texts.length; i += 10) {
      const batch = texts.slice(i, i + 10);
      const batchResults = await Promise.all(
        batch.map((text) => this._embed(text))
      );
      results.push(...batchResults);
      if (i + 10 < texts.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    return results;
  }

  /**
   * Embed a single query (used during retrieval).
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async embedQuery(text) {
    return this._embed(text);
  }
}

let _instance = null;

/**
 * Get or create a singleton Gemini embeddings instance.
 * @returns {GeminiEmbeddings}
 */
export function getEmbeddings() {
  if (!_instance) {
    _instance = new GeminiEmbeddings();
  }
  return _instance;
}
