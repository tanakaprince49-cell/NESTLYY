import { FoodResearchResult } from "../types.ts";

/* ==========================================
   AVA – Nestly Smart AI Companion
   Powered by DeepSeek (OpenRouter)
========================================== */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

/**
 * Standard fetch wrapper for OpenRouter API calls.
 * Uses process.env.API_KEY for authorization.
 */
async function callOpenRouter(messages: any[], jsonMode = false) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nestly.app",
      "X-Title": "Nestly Ava",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      temperature: 0.7,
      response_format: jsonMode ? { type: "json_object" } : undefined
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter Error: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/* ==========================================
   PUBLIC API – ADAPTERS FOR NESTLY
========================================== */

/**
 * Provides responses for the Ava chat companion.
 * Maps Gemini-style history to OpenRouter format.
 */
export async function getAvaResponse(
  chatHistory: { role: string; text: string }[],
  userName: string
): Promise<string> {
  try {
    const messages = [
      {
        role: "system",
        content: `
          You are Ava 💕, a warm, intelligent pregnancy companion for Nestly.
          USER NAME: ${userName}
          TONE: Caring, supportive, and slightly feminine.
          CORE RULES:
          1. Give medically responsible advice but ALWAYS remind users to consult their OBGYN/Midwife.
          2. Keep responses clear and emotionally supportive.
          3. Be EXTREMELY concise (maximum 1-2 sentences). 
          4. Use emojis like 🤍 or 🌸 sparingly but warmly.
          5. If a user mentions red-flag symptoms (high blood pressure, bleeding, reduced movement), tell them to call their provider IMMEDIATELY.
        `,
      },
      ...chatHistory.map(m => ({
        role: m.role === "model" ? "assistant" : "user",
        content: m.text
      }))
    ];

    return await callOpenRouter(messages);
  } catch (error) {
    console.error("Ava Error:", error);
    return "I'm having a quiet moment 💕. Please try again in a moment.";
  }
}

/**
 * General purpose chat response for "Mama AI" concierge.
 */
export async function getChatResponse(
  history: { role: string; content: string }[],
  systemInstruction: string
): Promise<string> {
  try {
    const messages = [
      { role: "system", content: systemInstruction },
      ...history.map(h => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.content
      }))
    ];
    return await callOpenRouter(messages);
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having a quiet moment 🤍. Please try again.";
  }
}

/**
 * AI Research for food safety and nutrition during pregnancy.
 * Returns structured JSON data.
 */
export async function getFoodResearch(food: string): Promise<FoodResearchResult> {
  try {
    const messages = [
      {
        role: "system",
        content: "You are a pregnancy nutrition expert. Return ONLY valid JSON matching the requested schema. Do not include markdown blocks."
      },
      {
        role: "user",
        content: `Analyze this food for a pregnant person: "${food}". 
        Provide a JSON object with exactly these keys: 
        name (string), 
        calories (number), 
        protein (number), 
        folate (number), 
        iron (number), 
        calcium (number), 
        safetyRating (string: "Safe", "Caution", or "Avoid"), 
        advice (string), 
        benefits (array of strings).`
      }
    ];

    const result = await callOpenRouter(messages, true);
    // Cleanup potential markdown wrappers if the model ignores the prompt instruction
    const cleanJson = result.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
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
      safetyRating: 'Caution',
      advice: "Research unavailable right now. Please check with your healthcare provider for safety advice.",
      benefits: ["N/A"]
    } as FoodResearchResult;
  }
}
