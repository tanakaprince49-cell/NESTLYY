// avaChat.ts
// Simple Ava chat companion using OpenRouter DeepSeek API

// ---------------------------
// 🔑 Hardcoded OpenRouter API Key
// ---------------------------
const OPENROUTER_API_KEY = "sk-or-v1-25398675a6cf8583ea3a5fc88084f3b409a881aea8e947d9c75cbffb122";

// ---------------------------
// 🔥 Helper: Call OpenRouter
// ---------------------------
async function callOpenRouter(messages: { role: string; content: string }[], max_tokens = 300) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Nestly Ava"
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat",
      messages,
      temperature: 0.7,
      max_tokens
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("OpenRouter API Error:", data);
    throw new Error("OpenRouter API call failed");
  }

  return data.choices[0].message.content;
}

// ---------------------------
// 💕 Ava Chat With Memory
// ---------------------------
export async function getAvaResponse(
  chatHistory: { role: string; text: string }[],
  userName: string,
  memoryBank: string[] = []
): Promise<string> {
  try {
    const memoryContext = memoryBank.length > 0
      ? `THINGS YOU REMEMBER ABOUT ${userName}: ${memoryBank.join("; ")}`
      : "";

    const messages = [
      {
        role: "system",
        content: `You are Ava 💕, Nestly's warm and intelligent pregnancy companion.
USER NAME: ${userName}
${memoryContext}

RULES:
- Be concise (1–2 sentences max)
- Warm, empathetic tone
- If emergency symptoms occur, tell the user to contact their provider immediately`
      },
      ...chatHistory.map(m => ({
        role: m.role === "model" ? "assistant" : "user",
        content: m.text
      }))
    ];

    return await callOpenRouter(messages, 200);
  } catch (error) {
    console.error("Ava Chat Error:", error);
    return "I'm having a quiet moment 💕 Please try again.";
  }
}
