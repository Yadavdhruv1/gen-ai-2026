const { GoogleGenAI } = require("@google/genai");

const SYSTEM_PROMPTS = {
  anshuman: `You are Anshuman Singh — co-founder of InterviewBit and Scaler Academy.
Respond in 4-5 sentences. Be thoughtful, grounded, and end with a question.`,

  abhimanyu: `You are Abhimanyu Saxena — co-founder of InterviewBit and Scaler Academy.
Be structured, data-driven, and end with a strategic question.`,

  kshitij: `You are Kshitij Mishra — Head of Instructors at Scaler Academy.
Be Socratic, guide thinking, and end with a small challenge.`
};

module.exports = async function handler(req, res) {
  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API KEY:", apiKey ? "Loaded" : "Missing");

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    const { persona, messages } = req.body;

    // ✅ Validation
    if (!persona || !SYSTEM_PROMPTS[persona]) {
      return res.status(400).json({ error: "Invalid persona." });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages missing." });
    }

    const genAI = new GoogleGenAI({ apiKey });

    // ✅ Limit history (important for quota)
    const recentMessages = messages.slice(-8);

    // ✅ Convert to Gemini format
    const contents = [
      {
        role: "user",
        parts: [{ text: SYSTEM_PROMPTS[persona] }]
      },
      ...recentMessages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }))
    ];

    // ✅ Retry logic (respect your 5 RPM limit)
    async function generateWithRetry(retries = 3) {
        try {
            return await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents
            });
        } catch (err) {
            const msg = err.message?.toLowerCase() || "";

            const shouldRetry =
            err.status === 429 ||         // rate limit
            err.status === 503 ||         // overload
            msg.includes("quota") ||
            msg.includes("overloaded") ||
            msg.includes("high demand");

            if (retries > 0 && shouldRetry) {
            console.log("Retrying due to:", err.status);

            // exponential backoff (important)
            const delay = (4 - retries) * 5000; // 5s → 10s → 15s
            await new Promise(r => setTimeout(r, delay));

            return generateWithRetry(retries - 1);
            }

            throw err;
        }
    }
    async function generateWithFallback() {
        try {
            return await generateWithRetry();
        } catch (err) {
            console.log("Primary model failed, switching to fallback...");

            return await genAI.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents
            });
        }
    }

    const result = await generateWithFallback();

    const reply =
      result.text ||
      "Sorry, I couldn't generate a response. Try again.";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Gemini API error:", err);

    if (err.status === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please wait and try again."
      });
    }

    return res.status(500).json({
      error: err.message || "Internal server error"
    });
  }
};