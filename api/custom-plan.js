export default async function handler(req, res) {
  const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
  const MODEL = "deepseek/deepseek-chat";

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { trimester, dietPreference, additionalInfo } = req.body;

    if (!trimester || !dietPreference) {
      return res.status(400).json({ error: "Trimester and dietPreference are required" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error("Custom Plan: OPENROUTER_API_KEY is not set");
      return res.status(500).json({ error: "Missing API key" });
    }

    const safeTrimester = String(trimester).trim();
    const safeDiet = String(dietPreference).trim();
    const safeInfo = additionalInfo ? String(additionalInfo).trim() : "";

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nestly.app",
        "X-Title": "Nestly Custom Plan",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are a pregnancy health expert. Create a personalized daily plan and return a JSON object.
The JSON must follow this structure exactly:
{
  "nutrition": {
    "breakfast": ["string"],
    "lunch": ["string"],
    "dinner": ["string"],
    "snacks": ["string"],
    "nutrients": [{"name": "string", "importance": "string"}]
  },
  "fitness": {
    "exercises": ["string"],
    "safety": ["string"],
    "frequency": "string"
  },
  "routine": {
    "morning": ["string"],
    "afternoon": ["string"],
    "evening": ["string"]
  },
  "medical": {
    "upcoming": ["string"],
    "questions": ["string"]
  }
}
Tailor the response to the user's trimester: ${safeTrimester} and diet preference: ${safeDiet}.
If diet is Vegan, ensure no animal products. If Gluten-Free, ensure no gluten.
Keep descriptions concise and actionable.`,
          },
          {
            role: "user",
            content: `Generate a plan for ${safeTrimester} with a ${safeDiet} diet. ${safeInfo}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Custom Plan: OpenRouter error:", err);
      return res.status(500).json({ error: "AI service error" });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    const plan = JSON.parse(cleaned);

    return res.status(200).json(plan);

  } catch (err) {
    console.error("Custom Plan: unexpected error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}
