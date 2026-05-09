# 📓 NotebookLM RAG — Chat with Your Documents

A full-stack RAG (Retrieval-Augmented Generation) application inspired by **Google NotebookLM**. Upload any PDF or text document and have a grounded AI conversation — every answer comes strictly from your document, not from the LLM's general knowledge.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-DC382D?logo=qdrant&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-JS-1C3C3C?logo=langchain&logoColor=white)

---

## ✨ Features

- **📄 Document Upload** — Supports PDF and plain text files (up to 20 MB)
- **✂️ Intelligent Chunking** — Uses RecursiveCharacterTextSplitter for semantic preservation
- **🧠 Vector Search** — Qdrant Cloud for high-performance semantic retrieval
- **🤖 Grounded Answers** — Strict system prompt ensures zero hallucination
- **📑 Source Citations** — Every answer references the source chunks
- **💬 Conversation History** — Multi-turn chat with context awareness
- **🎨 Premium UI** — Dark glassmorphism design with micro-animations

---

## 🏗️ RAG Pipeline Architecture

```
User uploads document
        │
        ▼
┌───────────────────┐
│   Document Loader  │  ← PDFLoader / Plain text
└────────┬──────────┘
         │
         ▼
┌───────────────────────────┐
│  RecursiveCharacterText   │  ← Chunk size: 1000 chars
│       Splitter            │  ← Overlap: 200 chars
└────────┬──────────────────┘
         │
         ▼
┌───────────────────┐
│  Gemini Embeddings │  ← gemini-embedding-001 (3072 dim)
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│   Qdrant Cloud     │  ← Vector storage & retrieval
└───────────────────┘
         │
         ▼  (on user query)
┌───────────────────┐
│  Semantic Search   │  ← Top-4 most relevant chunks
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Gemini 2.5 Flash  │  ← Grounded answer generation
└───────────────────┘
```

---

## 📐 Chunking Strategy

This project uses **LangChain's `RecursiveCharacterTextSplitter`**, the recommended default chunking strategy for RAG applications.

### How it works

The splitter recursively divides text along a hierarchy of separators:

1. **`"\n\n"`** — Paragraph boundaries (tried first)
2. **`"\n"`** — Line breaks
3. **`" "`** — Word boundaries
4. **`""`** — Individual characters (last resort)

This hierarchical approach **preserves semantic coherence**: it keeps paragraphs intact when possible, then falls back to sentences, then words.

### Configuration

| Parameter      | Value  | Rationale                                                      |
| -------------- | ------ | -------------------------------------------------------------- |
| `chunkSize`    | 1000   | Enough context per chunk while keeping embeddings topic-focused |
| `chunkOverlap` | 200    | Prevents context loss at boundaries; captures spanning sentences |

### Why this strategy?

- **Semantic preservation** — Unlike naive fixed-size splitting, recursive splitting respects natural text boundaries
- **Configurable granularity** — Easy to tune `chunkSize` and `chunkOverlap` based on document type
- **Industry standard** — Recommended by LangChain documentation as the go-to splitter for most use cases

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A free [Google Gemini API key](https://aistudio.google.com/apikey)
- A free [Qdrant Cloud](https://cloud.qdrant.io/) cluster

### Installation

```bash
# Clone the repository
git clone https://github.com/Yadavdhruv1/gen-ai-2026.git
cd notebooklm-rag

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Variables

Edit `.env` with your credentials:

```env
GOOGLE_API_KEY=your-gemini-api-key
QDRANT_URL=https://your-cluster-id.cloud.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
PORT=3000
```

### Run Locally

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment (Render)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables (`GOOGLE_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`)
6. Deploy!

---

## 📁 Project Structure

```
notebooklm-rag/
├── server.js               # Express entry point
├── package.json
├── .env.example             # Environment template
├── src/
│   ├── rag/
│   │   ├── ingest.js        # Document loading & chunking
│   │   ├── embeddings.js    # Gemini embedding config
│   │   ├── store.js         # Qdrant vector store operations
│   │   └── generate.js      # LLM answer generation
│   └── routes/
│       └── api.js           # REST API endpoints
├── public/
│   ├── index.html           # Frontend HTML
│   ├── styles.css           # Premium dark UI styles
│   └── app.js               # Frontend application logic
└── uploads/                 # Temporary upload directory
```

---

## 🛠️ Tech Stack

| Layer       | Technology                              |
| ----------- | --------------------------------------- |
| Backend     | Node.js + Express                       |
| Frontend    | Vanilla HTML / CSS / JavaScript         |
| Embeddings  | Google Gemini `gemini-embedding-001`    |
| Vector DB   | Qdrant Cloud                            |
| LLM         | Google Gemini `2.5-flash`               |
| Framework   | LangChain JS                            |
| Deployment  | Render                                  |

---

## 📜 License

MIT License
