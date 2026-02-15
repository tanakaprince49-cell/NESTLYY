import { FoodResearchResult, AvaMemoryFact } from "../types.ts";

// ---------------------------
// 🔑 Hardcoded OpenRouter API Key
// ---------------------------
const OPENROUTER_API_KEY = "sk-or-v1-25398675a6cf8583ea3a5fc88084f3b409a881aea8e947d9c75cbffb122";

// ---------------------------
// 🔥 Helper: Call OpenRouter
// ---------------------------
async function callOpenRouter(messages: any[], max_tokens = 300, model = "deepseek/deepseek-chat") {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Nestly Ava"
    },
    body: JSON.stringify({
      model,
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
  memoryBank: AvaMemoryFact[] = []
): Promise<string> {
  try {
    const memoryContext = memoryBank.length > 0
      ? `THINGS YOU REMEMBER ABOUT ${userName}: ${memoryBank.map(f => f.content).join("; ")}`
      : "";

    const messages = [
      {
        role: "system",
        content: `You are Ava 💕, Nestly's intelligent pregnancy companion.
USER NAME: ${userName}
${memoryContext}

RULES:
- Extremely concise (1–2 sentences max)
- Warm, intelligent tone
- If emergency symptoms (bleeding, severe pain, etc) → tell them to contact provider immediately`
      },
      ...chatHistory.map(m => ({
        role: m.role === "model" ? "assistant" : "user",
        content: m.text
      }))
    ];

    return await callOpenRouter(messages, 200);
  } catch (error) {
    console.error("Ava Error:", error);
    return "I'm having a quiet moment 💕 Please try again.";
  }
}

// ---------------------------
// 🧠 Memory Extraction
// ---------------------------
export async function extractMemories(
  chatHistory: { role: string; text: string }[],
  userName: string
): Promise<Partial<AvaMemoryFact>[]> {
  try {
    const messages = [
      {
        role: "system",
        content: `Extract persistent pregnancy-related facts about ${userName}.
Return ONLY valid JSON array:
[
  { "content": "...", "category": "preference | symptom | milestone | info" }
]`
      },
      {
        role: "user",
        content: chatHistory.map(m => `${m.role}: ${m.text}`).join("\n")
      }
    ];

    const result = await callOpenRouter(messages, 400);
    const cleanJson = result.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Memory Extraction Error:", e);
    return [];
  }
}

// ---------------------------
// 🍎 Food Research
// ---------------------------
export async function getFoodResearch(food: string): Promise<FoodResearchResult> {
  try {
    const messages = [
      {
        role: "system",
        content: "You are a pregnancy nutrition assistant. Return ONLY valid JSON."
      },
      {
        role: "user",
        content: `Analyze "${food}" for pregnancy safety.

Return JSON:
{
  "name": string,
  "calories": number,
  "protein": number,
  "folate": number,
  "iron": number,
  "calcium": number,
  "safetyRating": "Safe" | "Caution" | "Avoid",
  "advice": string,
  "benefits": string[]
}`
      }
    ];

    const result = await callOpenRouter(messages, 500);
    const cleanJson = result.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Food Research Error:", error);
    return {
      name: food,
      calories: 0,
      protein: 0,
      folate: 0,
      iron: 0,
      calcium: 0,
      safetyRating: "Caution",
      advice: "Unavailable right now. Please check with provider.",
      benefits: []
    };
  }
}

// ---------------------------
// 💬 General Chat
// ---------------------------
export async function getChatResponse(
  history: { role: string; content: string }[],
  systemInstruction: string
): Promise<string> {
  try {
    const messages = [
      { role: "system", content: systemInstruction },
      ...history
    ];

    return await callOpenRouter(messages, 300);
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having a quiet moment 🤍 Please try again.";
  }
}

// ---------------------------
// 👁️ Visual Food Analysis (Restored to prevent app crash)
// ---------------------------
export async function analyzeFoodImage(base64Image: string): Promise<FoodResearchResult> {
  try {
    const messages = [
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: "Analyze this meal for a pregnant woman. Return ONLY valid JSON: { \"name\": string, \"calories\": number, \"protein\": number, \"folate\": number, \"iron\": number, \"calcium\": number, \"safetyRating\": string, \"advice\": string, \"benefits\": string[] }" 
          },
          { 
            type: "image_url", 
            image_url: { url: base64Image } 
          }
        ]
      }
    ];

    const result = await callOpenRouter(messages, 800, "google/gemini-2.0-flash-001");
    const cleanJson = result.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Visual Analysis Error:", error);
    throw error;
  }
}
