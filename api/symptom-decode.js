export default async function handler(req, res) {
  const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
  const MODEL = "deepseek/deepseek-chat";

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify Firebase auth token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    const { initializeApp, cert, getApps } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");

    if (!getApps().length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : undefined;
      initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : {});
    }

    const token = authHeader.split("Bearer ")[1];
    try {
      await getAuth().verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: "Invalid authorization token" });
    }

    const { symptoms, trimester } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nestly.app",
        "X-Title": "Symptom Decoder",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert pregnancy symptom decoder. Analyze the user's input and return a JSON object.
JSON Structure:
{
  "validation": "string (start with empathy and validation)",
  "safetyRating": "Green | Amber | Red",
  "explanation": "string (1-2 sentences of why this may be happening)",
  "action": "string (1 specific actionable tip)",
  "medicalNote": "string (when to call a doctor)"
}
Rules:
- Non-alarmist but realistic.
- Tailor to trimester: ${trimester}.
- Red safety = Heavy bleeding, severe cramping, no movement.
- Return ONLY the JSON object.
- CRITICAL: You are an AI, not a doctor. Always include a disclaimer that this is not medical advice.`,
          },
          {
            role: "user",
            content: `I'm feeling: ${symptoms}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data });
    }

    const analysis = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return res.status(200).json(analysis);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
