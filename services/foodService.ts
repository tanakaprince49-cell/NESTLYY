/**
 * Food Analysis Service using OpenRouter
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

export interface FoodAnalysis {
  name: string;
  calories: number;
  protein: number;
  folate: number;
  iron: number;
  calcium: number;
}

export async function analyzeFood(foodQuery: string): Promise<FoodAnalysis | null> {
  try {
    const response = await fetch("/api/food/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ foodQuery }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return await response.json() as FoodAnalysis;
  } catch (error) {
    console.error("Food Analysis Error:", error);
    return null;
  }
}
