export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // TODO: Add Firebase auth token verification once FIREBASE_SERVICE_ACCOUNT is configured
  try {
    const { messages } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nestly.app",
        "X-Title": "Ava AI",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are Ava, a pregnancy companion.
Be VERY concise.
Max 2-3 short sentences.
Warm but direct.
No long explanations.
CRITICAL: You are not a doctor. Never provide medical diagnoses or prescribe treatments. Always advise consulting a healthcare professional for medical concerns.`,
          },
          ...messages,
        ],
        temperature: 0.5,
        max_tokens: 120,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "No response",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
