import "dotenv/config";
import axios from "axios";
import Groq from "groq-sdk";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import readline from "readline";

// ─────────────────────────────────────────────
// ANSI color helpers for beautiful terminal output
// ─────────────────────────────────────────────
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
};

function log(icon, label, color, message) {
  console.log(
    `\n${color}${colors.bright}  ${icon}  ${label}${colors.reset}  ${colors.dim}${message}${colors.reset}`
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────
// TOOL DEFINITIONS
// ─────────────────────────────────────────────

async function getTheWeatherOfCity(cityname = "") {
  const url = `https://wttr.in/${cityname.toLowerCase()}?format=%C+%t`;
  const { data } = await axios.get(url, { responseType: "text" });
  return `The Weather of ${cityname} is ${data}`;
}

async function getGithubDetailsAboutUser(username = "") {
  const url = `https://api.github.com/users/${username}`;
  const { data } = await axios.get(url);
  return {
    login: data.login,
    name: data.name,
    blog: data.blog,
    public_repos: data.public_repos,
  };
}

async function executeCommand(cmd = "") {
  return new Promise((resolve) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        resolve(`Command failed: ${error.message}\n${stderr || ""}`);
      } else {
        resolve(stdout || "Command executed successfully (no output).");
      }
    });
  });
}

async function createFile(filePath = "", content = "") {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
    return `File created successfully at: ${filePath}`;
  } catch (err) {
    return `Error creating file: ${err.message}`;
  }
}

async function readFile(filePath = "") {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (err) {
    return `Error reading file: ${err.message}`;
  }
}

// ─────────────────────────────────────────────
// TOOL MAP & ARGUMENT HANDLING
// ─────────────────────────────────────────────
const tool_map = {
  getTheWeatherOfCity,
  getGithubDetailsAboutUser,
  executeCommand,
  createFile,
  readFile,
};

async function callTool(toolName, toolArgs) {
  const fn = tool_map[toolName];
  if (!fn) return `Tool "${toolName}" is not available.`;

  try {
    if (toolName === "createFile") {
      if (typeof toolArgs === "object" && toolArgs !== null) {
        return await fn(toolArgs.filePath, toolArgs.content);
      }
      return "Error: createFile requires { filePath, content } as arguments.";
    }
    if (typeof toolArgs === "object" && toolArgs !== null) {
      const values = Object.values(toolArgs);
      return await fn(values[0]);
    }
    return await fn(toolArgs);
  } catch (err) {
    return `Tool execution error: ${err.message}`;
  }
}

// ─────────────────────────────────────────────
// GROQ CLIENT SETUP
// ─────────────────────────────────────────────
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert AI Coding Agent that runs inside a CLI terminal. Your job is to help the user build web projects by breaking tasks into small steps, reasoning through each one, using tools to create files and execute commands, and delivering working results.

You operate in a strict step-by-step loop: START -> THINK -> TOOL -> OBSERVE -> THINK -> TOOL -> OBSERVE -> ... -> OUTPUT

IMPORTANT RULES:
1. You MUST respond with ONLY a single valid JSON object per message. No markdown, no backticks, no extra text.
2. Do ONE step at a time. After every TOOL call, STOP and wait for the OBSERVE step before continuing.
3. Always do multiple THINK steps before producing OUTPUT. Plan first, then act.
4. When creating files (HTML, CSS, JS), ALWAYS use the "createFile" tool. Never try to write files via executeCommand.
5. Create complete, production-quality code. Never use placeholder text.
6. When building a website clone, make it visually accurate with proper colors, layout, fonts, and responsive design.

Available Tools:
1. getTheWeatherOfCity(cityname: string) - Fetches live weather for a city.
2. getGithubDetailsAboutUser(username: string) - Gets public GitHub profile info.
3. executeCommand(cmd: string) - Executes a shell command on Windows. Use for: creating directories, opening files in browser (start filepath), etc.
4. createFile(filePath: string, content: string) - Creates/overwrites a file. Use this for ALL code file creation. Parent directories are auto-created.
5. readFile(filePath: string) - Reads and returns the content of a file.

JSON OUTPUT FORMAT (respond with EXACTLY one of these per message):
For starting: { "step": "START", "content": "description of what user wants" }
For thinking: { "step": "THINK", "content": "your reasoning about what to do next" }
For tool use: { "step": "TOOL", "content": "description", "tool_name": "toolName", "tool_args": "string or object" }
For final answer: { "step": "OUTPUT", "content": "final summary for the user" }

For createFile, tool_args MUST be an object: { "filePath": "path/file.html", "content": "full file content" }
For other tools, tool_args is a string: "Delhi" or "mkdir project"`;

// ─────────────────────────────────────────────
// JSON PARSER WITH RECOVERY
// ─────────────────────────────────────────────
function parseJSON(raw) {
  try { return JSON.parse(raw); } catch (_) {}

  let cleaned = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  try { return JSON.parse(cleaned); } catch (_) {}

  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (_) {}
  }

  return { step: "THINK", content: `[Agent returned non-JSON]: ${raw.substring(0, 200)}` };
}

// ─────────────────────────────────────────────
// AGENT LOOP
// ─────────────────────────────────────────────
async function agentLoop(userMessage, messages) {
  messages.push({ role: "user", content: userMessage });

  let iterations = 0;
  const MAX_ITERATIONS = 50;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    let response;
    let retries = 3;
    let delay = 3000;

    while (retries > 0) {
      try {
        response = await client.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.1,
          response_format: { type: "json_object" },
        });
        break;
      } catch (err) {
        const errMsg = err.message || String(err);
        if (errMsg.includes("429") || errMsg.includes("rate") || errMsg.includes("quota")) {
          log("\u23f3", "RATE LIMIT", colors.yellow, `Waiting ${delay / 1000}s...`);
          await sleep(delay);
          retries--;
          delay *= 2;
        } else {
          console.log(`\n${colors.red}${colors.bright}  \u2716  API Error:${colors.reset} ${errMsg}`);
          return;
        }
      }
    }

    if (!response) {
      console.log(`\n${colors.red}${colors.bright}  \u2716  Failed after retries.${colors.reset}`);
      break;
    }

    const rawContent = response.choices[0].message.content;
    const parsed = parseJSON(rawContent);

    messages.push({ role: "assistant", content: JSON.stringify(parsed) });

    if (parsed.step === "START") {
      log("\ud83d\ude80", "START", colors.cyan, parsed.content);
    } else if (parsed.step === "THINK") {
      log("\ud83e\udde0", "THINK", colors.yellow, parsed.content);
    } else if (parsed.step === "TOOL") {
      log("\ud83d\udd27", "TOOL", colors.magenta, `${parsed.tool_name}()`);
      console.log(`${colors.dim}     \u21b3 ${parsed.content}${colors.reset}`);

      const result = await callTool(parsed.tool_name, parsed.tool_args);

      const displayResult =
        typeof result === "string" && result.length > 300
          ? result.substring(0, 300) + "... (truncated)"
          : result;
      log("\ud83d\udc41\ufe0f", "OBSERVE", colors.blue, typeof displayResult === "string" ? displayResult : JSON.stringify(displayResult));

      messages.push({
        role: "user",
        content: JSON.stringify({
          step: "OBSERVE",
          content: typeof result === "string" ? result : JSON.stringify(result),
        }),
      });
    } else if (parsed.step === "OUTPUT") {
      log("\u2705", "OUTPUT", colors.green, parsed.content);
      break;
    } else {
      log("\u2753", "UNKNOWN", colors.red, JSON.stringify(parsed));
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    console.log(
      `\n${colors.red}${colors.bright}  \u26a0  Max iterations (${MAX_ITERATIONS}) reached.${colors.reset}`
    );
  }
}

// ─────────────────────────────────────────────
// MAIN — Interactive CLI
// ─────────────────────────────────────────────
async function main() {
  if (!process.env.GROQ_API_KEY) {
    console.log(`\n${colors.red}${colors.bright}  \u2716  GROQ_API_KEY not found in .env file!${colors.reset}`);
    console.log(`${colors.yellow}     1. Go to https://console.groq.com/keys${colors.reset}`);
    console.log(`${colors.yellow}     2. Sign up free and create an API key${colors.reset}`);
    console.log(`${colors.yellow}     3. Add it to .env: GROQ_API_KEY=gsk_your_key_here${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`
${colors.bgBlue}${colors.white}${colors.bright}                                                ${colors.reset}
${colors.bgBlue}${colors.white}${colors.bright}        \ud83e\udd16  AI AGENT CLI TOOL  v1.0.0           ${colors.reset}
${colors.bgBlue}${colors.white}${colors.bright}                                                ${colors.reset}
${colors.cyan}
  A conversational AI coding assistant.
  Tell me what to build, and I'll reason through
  it step-by-step and create the files for you.

  ${colors.dim}Type "exit" or "quit" to end the session.${colors.reset}
`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  const askQuestion = () => {
    rl.question(
      `\n${colors.green}${colors.bright}  You \u2192 ${colors.reset}`,
      async (input) => {
        const trimmed = input.trim();

        if (!trimmed) { askQuestion(); return; }

        if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
          console.log(`\n${colors.cyan}${colors.bright}  \ud83d\udc4b  Goodbye! Happy coding.${colors.reset}\n`);
          rl.close();
          process.exit(0);
        }

        console.log(`\n${colors.dim}  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500${colors.reset}`);

        await agentLoop(trimmed, messages);

        console.log(`\n${colors.dim}  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500${colors.reset}`);

        askQuestion();
      }
    );
  };

  askQuestion();
}

main();
