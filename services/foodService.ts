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
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set");
    return null;
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nestly.app",
        "X-Title": "Nestly Food Tracker",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `
You are a nutrition expert. Analyze the food provided by the user and return its nutritional information in JSON format.
Return ONLY the JSON object with the following keys:
- name: string (the food name)
- calories: number (kcal)
- protein: number (grams)
- folate: number (mcg)
- iron: number (mg)
- calcium: number (mg)

If the food is unknown, return null.
Example: {"name": "Apple", "calories": 52, "protein": 0.3, "folate": 3, "iron": 0.1, "calcium": 6}
`,
          },
          {
            role: "user",
            content: foodQuery,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content) as FoodAnalysis;
  } catch (error) {
    console.error("Food Analysis Error:", error);
    return null;
  }
}
