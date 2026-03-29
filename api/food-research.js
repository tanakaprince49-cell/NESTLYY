export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth skipped: FIREBASE_SERVICE_ACCOUNT is not configured on Vercel (Hobby plan).
  // Endpoint is protected by server-side OPENROUTER_API_KEY only.
  try {
    const { foodName } = req.body;

    if (!foodName) {
      return res.status(400).json({ error: "Food name is required" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nestly.app",
        "X-Title": "Food Research AI",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content: `You are a nutrition expert. Analyze the given food and return a JSON object.
The JSON must have:
- explanation: 1-2 lines of what the food is.
- calories: estimated number per typical serving.
- protein: estimated grams per typical serving.
- folate: estimated mcg per typical serving.
- iron: estimated mg per typical serving.
- calcium: estimated mg per typical serving.
Return ONLY the JSON.`,
          },
          {
            role: "user",
            content: `Analyze this food: ${foodName}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Strip markdown code fences if present (e.g. ```json ... ```)
    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const analysis = JSON.parse(cleaned);

    return res.status(200).json(analysis);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
