import { FoodResearchResult, AvaMemoryFact } from "../types.ts";

// ---------------------------
// 🔑 Obtain API Key from environment variable
// ---------------------------
const OPENROUTER_API_KEY = process.env.API_KEY;

// ---------------------------
// 🔥 Helper: Call OpenRouter
// ---------------------------
async function callOpenRouter(messages: any[], model = "deepseek/deepseek-chat", max_tokens = 500) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nestly-app.pages.dev",
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
    throw new Error(data.error?.message || "OpenRouter API call failed");
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

    return await callOpenRouter(messages, "deepseek/deepseek-chat", 200);
  } catch (error) {
    console.error("Ava Error:", error);
    return "I'm having a quiet moment 💕 Please try again.";
  }
}

// ---------------------------
// 👁️ Visual Food Analysis (Uses Vision Model via OpenRouter)
// ---------------------------
export async function analyzeFoodImage(base64Image: string): Promise<FoodResearchResult> {
  try {
    const messages = [
      {
        role: "user",
        content: [
          { 
            type: "text", 
            text: "Analyze this meal for a pregnant woman. Identify the food and provide estimated nutritional values (calories, protein, folate, iron, calcium). Also provide a safety rating (Safe, Caution, Avoid) and brief advice. Return ONLY valid JSON matching this structure: { \"name\": string, \"calories\": number, \"protein\": number, \"folate\": number, \"iron\": number, \"calcium\": number, \"safetyRating\": string, \"advice\": string, \"benefits\": string[] }" 
          },
          { 
            type: "image_url", 
            image_url: { url: base64Image } 
          }
        ]
      }
    ];

    const result = await callOpenRouter(messages, "google/gemini-2.0-flash-001", 800);
    const cleanJson = result.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Visual Analysis Error:", error);
    throw error;
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

    const result = await callOpenRouter(messages, "deepseek/deepseek-chat", 400);
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

    const result = await callOpenRouter(messages, "deepseek/deepseek-chat", 500);
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

    return await callOpenRouter(messages, "deepseek/deepseek-chat", 400);
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having a quiet moment 🤍 Please try again.";
  }
}