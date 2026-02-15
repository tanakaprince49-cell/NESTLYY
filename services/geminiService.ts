
import { GoogleGenAI, Type } from "@google/genai";
import { FoodResearchResult, AvaMemoryFact } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Provides responses for the Ava chat companion using Gemini 3 Flash.
 */
export async function getAvaResponse(
  chatHistory: { role: string; text: string }[],
  userName: string,
  memoryBank: AvaMemoryFact[] = []
): Promise<string> {
  try {
    const memoryContext = memoryBank.length > 0 
      ? `THINGS YOU REMEMBER ABOUT ${userName}: ${memoryBank.map(f => f.content).join('; ')}`
      : "";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [{
            text: `You are Ava 💕, Nestly's intelligent and warm pregnancy companion.
            USER NAME: ${userName}
            ${memoryContext}
            CORE RULES:
            1. med-responsible but OBGYN reminder.
            2. Warm, intelligent tone.
            3. BE EXTREMELY CONCISE (max 1-2 sentences).
            4. If medical emergency symptoms (bleeding, etc) tell them to call a provider NOW.
            
            Current conversation history follows.`
          }]
        },
        ...chatHistory.map(m => ({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.text }]
        }))
      ]
    });

    return response.text || "I'm having a quiet moment 💕. Please try again.";
  } catch (error) {
    console.error("Ava Gemini Error:", error);
    return "I'm having a quiet moment 💕. Please try again in a moment.";
  }
}

/**
 * Extracts key facts from a conversation to update Ava's memory.
 */
export async function extractMemories(
  chatHistory: { role: string; text: string }[],
  userName: string
): Promise<Partial<AvaMemoryFact>[]> {
  try {
    const prompt = `Analyze this conversation between Ava (AI) and ${userName}. 
    Extract any persistent facts about ${userName}'s pregnancy, health, cravings, or milestones.
    Ignore general greetings or small talk.
    Return ONLY a JSON array of objects with keys: content (string), category (one of: preference, symptom, milestone, info).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt + "\n\nConversation:\n" + chatHistory.map(m => `${m.role}: ${m.text}`).join('\n') }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["content", "category"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Memory Extraction Error:", e);
    return [];
  }
}

/**
 * AI Research for food safety and nutrition during pregnancy.
 */
export async function getFoodResearch(food: string): Promise<FoodResearchResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this food for a pregnant person: "${food}". 
      Provide a detailed report including calorie count, protein, folate, iron, calcium, and a safety rating.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            folate: { type: Type.NUMBER },
            iron: { type: Type.NUMBER },
            calcium: { type: Type.NUMBER },
            safetyRating: { type: Type.STRING, description: '"Safe", "Caution", or "Avoid"' },
            advice: { type: Type.STRING },
            benefits: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "calories", "protein", "folate", "iron", "calcium", "safetyRating", "advice", "benefits"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
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

/**
 * General purpose chat response.
 */
export async function getChatResponse(
  history: { role: string; content: string }[],
  systemInstruction: string
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: systemInstruction }] },
        ...history.map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        }))
      ]
    });
    return response.text || "I'm having a quiet moment 🤍. Please try again.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having a quiet moment 🤍. Please try again.";
  }
}
