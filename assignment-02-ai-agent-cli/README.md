# 🤖 AI Agent CLI Tool

A conversational AI Agent that runs in your terminal — similar to how **Cursor** or **Windsurf** work. Chat with the agent using natural language, and it will reason through your instructions step-by-step to generate real, working code files.

## ✨ Features

- **Interactive Chat Interface** — continuous terminal-based conversation with the AI agent
- **Step-by-Step Reasoning** — the agent follows a structured `START → THINK → TOOL → OBSERVE → OUTPUT` loop, breaking complex tasks into smaller steps
- **File Creation Tool** — dedicated `createFile()` tool that reliably writes HTML, CSS, and JS files with full content
- **Command Execution** — `executeCommand()` tool to run shell commands (create directories, open browsers, etc.)
- **Persistent Conversation** — multi-turn context; ask follow-up questions or request modifications
- **Robust Error Handling** — graceful JSON recovery, API error handling, and iteration safety limits
- **Beautiful Terminal UI** — color-coded output with emoji indicators for each reasoning step

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES Modules)
- **AI Model**: OpenAI GPT-4o-mini
- **Libraries**: `openai`, `axios`, `dotenv`

## 📦 Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- An [OpenAI API Key](https://platform.openai.com/api-keys)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-agent-cli.git
   cd ai-agent-cli
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up your API key:**
   Create a `.env` file in the root directory:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

4. **Run the agent:**
   ```bash
   npm start
   ```

## 🚀 Usage

Once the agent starts, you'll see an interactive prompt. Type any instruction in natural language:

```
  You → Clone the Scaler Academy website. Create a folder called scaler_clone and generate
        index.html, style.css, and script.js that replicate the Header, Hero Section, and
        Footer of scaler.com. Then open index.html in my browser.
```

The agent will:
1. **START** — Acknowledge and understand the task
2. **THINK** — Plan the approach (multiple reasoning steps)
3. **TOOL** — Create directories, write files, execute commands
4. **OBSERVE** — Verify each action's result
5. **OUTPUT** — Deliver the final summary

### Example Agent Loop Output
```
  🚀  START   User wants me to clone the Scaler Academy website...

  🧠  THINK   I need to create a project folder first...

  🔧  TOOL    executeCommand()
     ↳ Creating the scaler_clone directory

  👁️  OBSERVE  Command executed successfully

  🧠  THINK   Now I'll create the HTML file with header, hero, and footer...

  🔧  TOOL    createFile()
     ↳ Writing index.html with the full Scaler website structure

  👁️  OBSERVE  File created successfully at: scaler_clone/index.html

  ✅  OUTPUT  Website clone created! Files are in scaler_clone/
```

## 🧰 Available Tools

| Tool | Description |
|------|-------------|
| `createFile(filePath, content)` | Creates a file with the given content. Auto-creates parent directories. |
| `readFile(filePath)` | Reads and returns the contents of a file. |
| `executeCommand(cmd)` | Executes a shell command on the user's machine. |
| `getTheWeatherOfCity(cityname)` | Fetches live weather data for a city. |
| `getGithubDetailsAboutUser(username)` | Gets public GitHub profile information. |

## 📂 Project Structure

```
ai-agent-cli/
├── index.js          # Main agent code (entry point)
├── package.json      # Project metadata & dependencies
├── .env              # API key configuration (not committed)
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## 🧠 Agent Architecture

The agent uses a **ReAct-style reasoning loop**:

```
User Input
    ↓
┌─────────┐
│  START   │ → Acknowledge the task
└────┬─────┘
     ↓
┌─────────┐
│  THINK   │ → Reason about next action  ◄──┐
└────┬─────┘                                 │
     ↓                                       │
┌─────────┐                                  │
│  TOOL    │ → Execute an action             │
└────┬─────┘                                 │
     ↓                                       │
┌─────────┐                                  │
│ OBSERVE  │ → See the result ───────────────┘
└────┬─────┘
     ↓
┌─────────┐
│ OUTPUT   │ → Deliver final answer
└─────────┘
```

## 📝 License

ISC
