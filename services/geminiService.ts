// geminiServices.ts
type ChatMessage = { role: "user" | "assistant"; text: string };
type MemoryFact = string;

const OPENROUTER_API_KEY = process.env.API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

/**
 * Get Ava's chat response
 */
export async function getAvaResponse(
  chatHistory: ChatMessage[],
  userName: string,
  memoryBank: MemoryFact[] = []
): Promise<string> {
  try {
    const memoryContext = memoryBank.length 
      ? `THINGS YOU REMEMBER ABOUT ${userName}: ${memoryBank.join("; ")}`
      : "";

    const systemMessage = {
      role: "system",
      content: `You are Ava 💕, Nestly's warm pregnancy companion.
USER NAME: ${userName}
${memoryContext}
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
 * Make Ava speak using browser TTS
 */
export function speakAva(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.1;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

/**
 * General chat response for other components
 */
export async function getChatResponse(
  chatHistory: { role: string; content: string }[],
  systemInstruction: string
): Promise<string> {
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: systemInstruction }, ...chatHistory],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "I'm having a quiet moment 🤍";
  } catch (err) {
    return "I'm having a quiet moment 🤍";
  }
}
