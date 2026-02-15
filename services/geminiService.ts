// avaChat.ts
type ChatMessage = { role: "user" | "assistant"; text: string };
type MemoryFact = string;

const OPENROUTER_API_KEY = "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";
const OPENROUTER_URLj = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

/**
 * Send a message to Ava and get a short empathetic response
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

    const messages = [
      {
        role: "system",
        content: `You are Ava 💕, Nestly's warm pregnancy companion.
USER NAME: ${userName}
${memoryContext}
RULES:
- Extremely concise (1–2 sentences)
- Warm, empathetic, supportive
- Emergency symptoms: tell user to contact provider immediately`
      },
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
