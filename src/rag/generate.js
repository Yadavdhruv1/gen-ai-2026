/**
 * generate.js — LLM Answer Generation with Strict Grounding
 *
 * Uses Google Gemini 2.0 Flash (FREE tier) via direct REST API
 * for answer generation. Retrieves the most relevant chunks from
 * the vector store and feeds them as context.
 */

import { getRetriever } from "./store.js";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * Build the grounded system prompt.
 */
function buildSystemPrompt(contextChunks) {
  const formattedContext = contextChunks
    .map((chunk, i) => {
      const page =
        chunk.metadata?.loc?.pageNumber ?? chunk.metadata?.page ?? "N/A";
      return `--- Chunk ${i + 1} (Page ${page}) ---\n${chunk.pageContent}`;
    })
    .join("\n\n");

  return `You are a document-grounded AI assistant, similar to Google NotebookLM.
Your ONLY source of truth is the CONTEXT below, which was extracted from the user's uploaded document.

STRICT RULES:
1. Answer EXCLUSIVELY based on the provided context. Do NOT use your general knowledge.
2. If the context does not contain enough information to answer the question, respond with:
   "I could not find the answer to that in your document. Please try rephrasing your question or check if the relevant section is included in the uploaded file."
3. When possible, reference the page number or section from the context.
4. Keep your answers clear, well-structured, and helpful.
5. If the user asks something completely unrelated to the document, politely redirect them.

CONTEXT FROM DOCUMENT:
${formattedContext}`;
}

/**
 * Generate a grounded answer for the user's query.
 * @param {string} userQuery
 * @param {string} collection
 * @param {Array} [chatHistory=[]]
 * @returns {Promise<{answer: string, sources: object[]}>}
 */
export async function generateAnswer(userQuery, collection, chatHistory = []) {
  const apiKey = process.env.GOOGLE_API_KEY;

  // 1. Retrieve relevant chunks
  const retriever = await getRetriever(collection, 4);
  const relevantChunks = await retriever.invoke(userQuery);

  // 2. Build system instruction and contents
  const systemPrompt = buildSystemPrompt(relevantChunks);

  // Build Gemini-format contents array (history + new message)
  const contents = [];
  for (const msg of chatHistory) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }
  contents.push({
    role: "user",
    parts: [{ text: userQuery }],
  });

  // 3. Call Gemini API
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.3,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  const answer =
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Sorry, I could not generate an answer.";

  // 4. Return answer + source metadata
  const sources = relevantChunks.map((chunk, i) => ({
    chunkIndex: chunk.metadata?.chunkIndex ?? i,
    page:
      chunk.metadata?.loc?.pageNumber ?? chunk.metadata?.page ?? "N/A",
    preview: chunk.pageContent.substring(0, 150) + "…",
  }));

  return { answer, sources };
}
