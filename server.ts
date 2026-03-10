import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || "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";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

if (!OPENROUTER_API_KEY) {
  console.error("Missing OPENROUTER_API_KEY");
  process.exit(1);
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =========================
   FOOD ANALYSIS ENDPOINT
========================= */

app.post("/api/food/analyze", async (req, res) => {
  const { foodQuery } = req.body;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nestly.app",
        "X-Title": "Nestly Food Tracker"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content: `
You are a nutrition expert.
Return ONLY JSON with:
name, calories, protein, folate, iron, calcium
`
          },
          {
            role: "user",
            content: foodQuery
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    const content = data.choices[0].message.content;

    res.json(JSON.parse(content));

  } catch (error) {
    console.error("Food analysis error:", error);
    res.status(500).json({ error: "Food analysis failed" });
  }
});

/* =========================
   AVA AI CHAT ENDPOINT
========================= */

app.post("/api/ava/chat", async (req, res) => {
  const { messages } = req.body;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nestly.app",
        "X-Title": "Nestly Ava AI"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content: `
You are Ava, the AI pregnancy assistant inside Nestly.

Follow WHO guidance.
Be warm but concise.
Maximum 2–3 short sentences.
Encourage users to consult a healthcare professional for medical advice.
`
          },
          ...messages
        ],
        temperature: 0.5,
        max_tokens: 120
      })
    });

    const data = await response.json();

    res.json({
      content: data.choices[0].message.content
    });

  } catch (error) {
    console.error("Ava AI error:", error);
    res.status(500).json({ error: "Ava AI failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});