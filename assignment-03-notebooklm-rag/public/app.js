/**
 * app.js — Frontend Application Logic
 *
 * Handles file uploads, chat messaging, and screen transitions.
 */

// ─── DOM Elements ───────────────────────────────────────
const uploadScreen  = document.getElementById("upload-screen");
const chatScreen    = document.getElementById("chat-screen");
const headerStatus  = document.getElementById("header-status");
const uploadForm    = document.getElementById("upload-form");
const fileInput     = document.getElementById("file-input");
const fileDrop      = document.getElementById("file-drop");
const dropLabel     = document.getElementById("drop-label");
const uploadBtn     = document.getElementById("upload-btn");
const chatForm      = document.getElementById("chat-form");
const chatInput     = document.getElementById("chat-input");
const messagesEl    = document.getElementById("messages");
const docTitle      = document.getElementById("doc-title");
const newDocBtn     = document.getElementById("new-doc-btn");

// ─── State ──────────────────────────────────────────────
let currentCollection = null;
let chatHistory = [];
let isProcessing = false;

// ─── Toast helper ───────────────────────────────────────
function showToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}

// ─── Screen transitions ────────────────────────────────
function showScreen(screen) {
  uploadScreen.classList.remove("active");
  chatScreen.classList.remove("active");
  screen.classList.add("active");
}

// ─── File input handling ────────────────────────────────
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    const name = fileInput.files[0].name;
    dropLabel.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      ${name}`;
    fileDrop.classList.add("has-file");
    uploadBtn.disabled = false;
  }
});

// Drag & drop
fileDrop.addEventListener("dragover", (e) => {
  e.preventDefault();
  fileDrop.classList.add("dragover");
});
fileDrop.addEventListener("dragleave", () => {
  fileDrop.classList.remove("dragover");
});
fileDrop.addEventListener("drop", (e) => {
  e.preventDefault();
  fileDrop.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event("change"));
  }
});

// ─── Upload handler ────────────────────────────────────
uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!fileInput.files.length || isProcessing) return;

  isProcessing = true;
  const btnText   = uploadBtn.querySelector(".btn-text");
  const btnLoader = uploadBtn.querySelector(".btn-loader");

  btnText.textContent = "Processing…";
  btnLoader.hidden = false;
  uploadBtn.disabled = true;

  const formData = new FormData();
  formData.append("document", fileInput.files[0]);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Upload failed");

    currentCollection = data.collection;
    chatHistory = [];

    // Update UI
    const fileName = fileInput.files[0].name;
    docTitle.textContent = fileName;
    headerStatus.textContent = `📄 ${fileName} · ${data.totalChunks} chunks`;
    headerStatus.classList.add("active");

    // Reset messages
    messagesEl.innerHTML = `
      <div class="message assistant welcome-msg">
        <div class="msg-avatar">🤖</div>
        <div class="msg-body">
          <p>Your document <strong>"${fileName}"</strong> has been indexed into <strong>${data.totalChunks} chunks</strong>. Ask me anything about it!</p>
        </div>
      </div>`;

    showScreen(chatScreen);
    chatInput.focus();
  } catch (err) {
    showToast(err.message);
  } finally {
    isProcessing = false;
    btnText.textContent = "Upload & Index";
    btnLoader.hidden = true;
    uploadBtn.disabled = false;
  }
});

// ─── Chat handler ──────────────────────────────────────
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = chatInput.value.trim();
  if (!query || !currentCollection || isProcessing) return;

  isProcessing = true;

  // Add user message
  appendMessage("user", query);
  chatInput.value = "";

  // Add typing indicator
  const typingEl = appendTyping();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        collection: currentCollection,
        history: chatHistory,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Chat failed");

    // Remove typing indicator
    typingEl.remove();

    // Add assistant answer
    appendMessage("assistant", data.answer, data.sources);

    // Update history
    chatHistory.push({ role: "user", content: query });
    chatHistory.push({ role: "assistant", content: data.answer });

    // Keep only last 10 exchanges (20 messages) to avoid token overflow
    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(-20);
    }
  } catch (err) {
    typingEl.remove();
    showToast(err.message);
  } finally {
    isProcessing = false;
  }
});

// ─── Message helpers ───────────────────────────────────
function appendMessage(role, content, sources) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "user" ? "👤" : "🤖";

  const body = document.createElement("div");
  body.className = "msg-body";

  // Format content — convert markdown-like bold and newlines
  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
  body.innerHTML = `<p>${formatted}</p>`;

  // Add source citations
  if (sources && sources.length > 0) {
    const pages = [...new Set(sources.map((s) => s.page).filter((p) => p !== "N/A"))];
    if (pages.length > 0) {
      const tag = document.createElement("span");
      tag.className = "sources-tag";
      tag.textContent = `📑 Sources: Page ${pages.join(", ")}`;
      body.appendChild(tag);
    }
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(body);
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function appendTyping() {
  const wrapper = document.createElement("div");
  wrapper.className = "message assistant typing";

  wrapper.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-body">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>`;

  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrapper;
}

// ─── New document button ────────────────────────────────
newDocBtn.addEventListener("click", () => {
  currentCollection = null;
  chatHistory = [];
  fileInput.value = "";
  fileDrop.classList.remove("has-file");
  dropLabel.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    Drag & drop or click to select`;
  uploadBtn.disabled = true;
  headerStatus.textContent = "No document loaded";
  headerStatus.classList.remove("active");
  showScreen(uploadScreen);
});

// ─── Enter key support (shift+enter for newlines) ──────
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event("submit"));
  }
});
