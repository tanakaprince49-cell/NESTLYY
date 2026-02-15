// geminiServices.ts
type ChatMessage = { role: "user" | "assistant"; text: string };

const OPENROUTER_API_KEY = "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

/**
 * Get Ava's chat response
 */
export async function getAvaResponse(
  chatHistory: ChatMessage[],
  userName: string
): Promise<string> {
  try {
    const systemMessage = {
      role: "system",
      content: `You are Ava 💕, Nestly's warm pregnancy companion.
USER NAME: ${userName}
RULES:
- Extremely concise (1–2 sentences)
- Warm, empathetic, supportive
- If emergency symptoms (bleeding, severe pain), tell user to contact provider immediately`
    };

    const messages = [
      systemMessage,
      ...chatHistory.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text
      }))
    ];

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 200
      })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Ava is taking a quiet moment 💕";
  } catch (err) {
    console.error("Ava API Error:", err);
    return "Ava is taking a quiet moment 💕";
  }
}

/**
 * Example usage:
 * (async () => {
 *   const response = await getAvaResponse(
 *     [{ role: "user", text: "Hi Ava, how am I feeling today?" }],
 *     "Tanaka"
 *   );
 *   console.log("Ava:", response);
 * })();
 */