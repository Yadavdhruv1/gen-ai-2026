# ScalerChat — Persona-Based AI Chatbot

A premium AI chatbot that lets you have real conversations with three Scaler Academy / InterviewBit personalities: **Anshuman Singh**, **Abhimanyu Saxena**, and **Kshitij Mishra**.

Built for **Gen AI Assignment 01 — Prompt Engineering | Scaler Academy**.

🔗 **Live Demo**: [https://assignment-01-persona-chatbot.vercel.app](https://assignment-01-persona-chatbot.vercel.app)

---

## Screenshots

| Persona Switcher | Chat in Action |
|:-:|:-:|
| ![Home](https://via.placeholder.com/400x300?text=Persona+Switcher) | ![Chat](https://via.placeholder.com/400x300?text=Chat+View) |

---

## Features

- 🎭 **3 Distinct Personas** — Anshuman Singh, Abhimanyu Saxena, Kshitij Mishra
- 💬 **Real AI Conversations** — Powered by Google Gemini 2.0 Flash
- 🔄 **Persona Switching** — Tabs to switch; conversation resets on switch
- 💡 **Suggestion Chips** — Quick-start questions per persona
- ⏳ **Typing Indicator** — Visual feedback while AI responds
- 📱 **Fully Responsive** — Works on mobile and desktop
- 🛡️ **Secure** — API key stored server-side, never exposed to client
- 🎨 **Premium Dark UI** — Glassmorphism, ambient animations, micro-interactions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Backend | Vercel Serverless Function (Node.js) |
| LLM | Google Gemini 2.0 Flash API |
| Deployment | Vercel |

---

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- A free Google Gemini API key ([Get one here](https://aistudio.google.com/apikey))
- Vercel CLI (optional, for local dev)

### Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/Yadavdhruv1/gen-ai-2026.git
   cd gen-ai-2026/assignment-01-persona-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

4. **Run locally with Vercel CLI**
   ```bash
   npx vercel dev
   ```

5. **Open** `http://localhost:3000` in your browser

### Deploy to Vercel

1. Push to GitHub
2. Import the project in [Vercel Dashboard](https://vercel.com/new)
3. Set `GEMINI_API_KEY` in Vercel → Settings → Environment Variables
4. Deploy!

---

## Project Structure

```
assignment-01-persona-chatbot/
├── index.html          # Chat UI
├── style.css           # Premium dark theme
├── script.js           # Frontend logic
├── api/
│   └── chat.js         # Serverless API (Gemini integration)
├── vercel.json         # Vercel routing config
├── package.json        # Dependencies
├── .env.example        # Environment variable template
├── .gitignore          # Git ignore rules
├── prompts.md          # System prompts with annotations
├── reflection.md       # 300-500 word reflection
└── README.md           # This file
```

---

## Documentation

- **[prompts.md](./prompts.md)** — All three system prompts with inline annotations explaining design decisions
- **[reflection.md](./reflection.md)** — Reflection on what worked, GIGO learnings, and improvements

---

## Author

**Dhruv Yadav** — Scaler Academy, Gen AI Module 2026
