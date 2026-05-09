// ============================================
// ScalerChat — Frontend Logic
// ============================================

const PERSONAS = {
    anshuman: {
        name: "Anshuman Singh",
        initials: "AS",
        role: "Co-founder, Scaler & InterviewBit",
        gradient: "linear-gradient(135deg, #6366f1, #818cf8)",
        welcome: "Hey there! I'm Anshuman — co-founder of Scaler and InterviewBit. I spent years at Facebook building Messenger, and now I'm obsessed with fixing education. What's on your mind?",
        chips: [
            "What made you leave Facebook to start Scaler?",
            "How do you define a world-class engineer?",
            "What does 'education is addiction' mean?"
        ]
    },
    abhimanyu: {
        name: "Abhimanyu Saxena",
        initials: "AX",
        role: "Co-founder, Scaler & InterviewBit",
        gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
        welcome: "Hi! I'm Abhimanyu — co-founder of Scaler. From IIT Roorkee to Fab.com in NYC to building India's largest tech upskilling platform. I love talking about startups, the talent gap, and the future of work. Shoot!",
        chips: [
            "What's the biggest talent gap you've seen?",
            "What does 'never fall in love with your solution' mean?",
            "How should I prepare for top tech companies?"
        ]
    },
    kshitij: {
        name: "Kshitij Mishra",
        initials: "KM",
        role: "Head of Instructors, Scaler",
        gradient: "linear-gradient(135deg, #10b981, #34d399)",
        welcome: "Hello! I'm Kshitij — Head of Instructors at Scaler. I've been teaching DSA and problem-solving for over a decade. I believe in logic over memorization. Let's think through something together — what would you like to explore?",
        chips: [
            "How should I approach a new DSA problem?",
            "What's the most common mistake beginners make in coding?",
            "Can you explain the two-pointer technique?"
        ]
    }
};

// State
let currentPersona = "anshuman";
let conversations = { anshuman: [], abhimanyu: [], kshitij: [] };
let isLoading = false;

// DOM Elements
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typingIndicator");
const typingAvatar = document.getElementById("typingAvatar");
const suggestionChips = document.getElementById("suggestionChips");
const activePersonaName = document.getElementById("activePersonaName");
const toastContainer = document.getElementById("toastContainer");
const personaTabs = document.querySelectorAll(".persona-tab");

// Initialize
function init() {
    switchPersona("anshuman");
    setupEventListeners();
}

function setupEventListeners() {
    // Persona tabs
    personaTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            if (!isLoading) {
                switchPersona(tab.dataset.persona);
            }
        });
    });

    // Send button
    sendBtn.addEventListener("click", sendMessage);

    // Input handling
    messageInput.addEventListener("input", () => {
        sendBtn.disabled = messageInput.value.trim() === "";
        autoResizeTextarea();
    });

    messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (messageInput.value.trim()) sendMessage();
        }
    });
}

function autoResizeTextarea() {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + "px";
}

// Persona Switching
function switchPersona(persona) {
    currentPersona = persona;
    const p = PERSONAS[persona];

    // Update tabs
    personaTabs.forEach(tab => {
        tab.classList.toggle("active", tab.dataset.persona === persona);
    });

    // Update header badge
    activePersonaName.textContent = p.name;

    // Update typing avatar
    typingAvatar.textContent = p.initials;
    typingAvatar.style.background = p.gradient;

    // Clear chat and show welcome
    renderChat();

    // Show suggestion chips
    renderChips();
}

function renderChat() {
    const p = PERSONAS[currentPersona];
    const msgs = conversations[currentPersona];
    chatMessages.innerHTML = "";

    // Welcome message
    const welcomeEl = createMessageEl("bot", p.welcome, p, true);
    chatMessages.appendChild(welcomeEl);

    // Existing messages
    msgs.forEach(msg => {
        const el = createMessageEl(msg.role === "user" ? "user" : "bot", msg.content, p);
        chatMessages.appendChild(el);
    });

    scrollToBottom();
}

function createMessageEl(type, text, persona, isWelcome = false) {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${type}${isWelcome ? " welcome" : ""}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";

    if (type === "user") {
        avatar.textContent = "You";
        avatar.style.background = "linear-gradient(135deg, #6366f1, #a855f7)";
    } else {
        avatar.textContent = persona.initials;
        avatar.style.background = persona.gradient;
    }

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = text;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    return wrapper;
}

function renderChips() {
    const chips = PERSONAS[currentPersona].chips;
    suggestionChips.innerHTML = "";
    chips.forEach(text => {
        const chip = document.createElement("button");
        chip.className = "chip";
        chip.textContent = text;
        chip.addEventListener("click", () => {
            messageInput.value = text;
            sendBtn.disabled = false;
            sendMessage();
        });
        suggestionChips.appendChild(chip);
    });
}

// Send Message
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || isLoading) return;

    isLoading = true;
    messageInput.value = "";
    messageInput.style.height = "auto";
    sendBtn.disabled = true;

    // Hide suggestion chips after first message
    suggestionChips.innerHTML = "";

    // Add user message
    conversations[currentPersona].push({ role: "user", content: text });
    const userEl = createMessageEl("user", text, PERSONAS[currentPersona]);
    chatMessages.appendChild(userEl);
    scrollToBottom();

    // Show typing indicator
    showTyping(true);

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                persona: currentPersona,
                messages: conversations[currentPersona]
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Request failed (${response.status})`);
        }

        const data = await response.json();
        const botText = data.reply || "Sorry, I couldn't generate a response.";

        conversations[currentPersona].push({ role: "assistant", content: botText });
        const botEl = createMessageEl("bot", botText, PERSONAS[currentPersona]);
        chatMessages.appendChild(botEl);
    } catch (err) {
        console.error("API Error:", err);
        showToast(err.message || "Something went wrong. Please try again.");
    } finally {
        showTyping(false);
        isLoading = false;
        scrollToBottom();
    }
}

// Typing Indicator
function showTyping(visible) {
    typingIndicator.classList.toggle("visible", visible);
    if (visible) scrollToBottom();
}

// Scroll
function scrollToBottom() {
    requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// Toast
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Start
init();
