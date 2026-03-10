/* ==========================================
   NESTLY AI – Ava + Food Research + Smart Guidance
========================================== */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";
const OPENROUTER_API_KEY =
  "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";

/* ==========================================
   MEMORY (Local Storage)
========================================== */
const MEMORY_KEY = "ava_memory";

function saveMemory(messages: any[]) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(messages));
}

function loadMemory() {
  const memory = localStorage.getItem(MEMORY_KEY);
  return memory ? JSON.parse(memory) : [];
}

/* ==========================================
   CORE OPENROUTER CALL
========================================== */
async function callOpenRouter(messages: any[], title = "Ava AI", maxTokens = 120) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nestly.app",
      "X-Title": title,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.5,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.choices[0].message.content;
}

/* ==========================================
   AVA CHAT FUNCTION
========================================== */
export async function getAvaResponse(userMessage: string, pregnancyWeek?: number) {
  try {
    let memory = loadMemory();

    memory.push({ role: "user", content: userMessage });
    memory = memory.slice(-6);

    const systemPrompt = `
You are Ava, a pregnancy companion.
Be VERY concise (max 2-3 short sentences). Warm but direct.
Focus on nutrition, physical activity, breastfeeding, newborn care.
Provide WHO-based advice.
Pregnancy Week: ${pregnancyWeek || "unknown"}.
`;

    const reply = await callOpenRouter([{ role: "system", content: systemPrompt }, ...memory]);

    memory.push({ role: "assistant", content: reply });
    saveMemory(memory);

    return reply;
  } catch (error) {
    console.error("Ava Error:", error);
    return "Hmm… I’m reconnecting 💕";
  }
}

/* ==========================================
   FOOD RESEARCH (Pregnancy Nutrition)
========================================== */
export async function analyzeFood(food: string) {
  try {
    const content = `
You are a pregnancy nutrition expert.
Return ONLY JSON with keys:
name, calories, protein, folate, iron, calcium.
If food is unsafe for pregnancy, add "unsafe": true.
Example: {"name":"Apple","calories":52,"protein":0.3,"folate":3,"iron":0.1,"calcium":6,"unsafe":false}
Food: ${food}
`;

    const reply = await callOpenRouter([
      { role: "system", content },
      { role: "user", content: food }
    ], "Nestly Food Research", 200);

    return JSON.parse(reply);
  } catch (error) {
    console.error("Food Analysis Error:", error);
    return null;
  }
}

/* ==========================================
   PREGNANCY WEEK DETECTION
========================================== */
export function calculatePregnancyWeek(lmpDate: string) {
  const diff = new Date().getTime() - new Date(lmpDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}

/* ==========================================
   VOICE: TEXT → SPEECH
========================================== */
export function speak(text: string) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.rate = 1;
  speech.pitch = 1.1;
  speech.lang = "en-US";
  window.speechSynthesis.speak(speech);
}

/* ==========================================
   VOICE: SPEECH → TEXT
========================================== */
export function listen(callback: (text: string) => void) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();
  recognition.onresult = (event: any) => callback(event.results[0][0].transcript);
}

/* ==========================================
   EXAMPLE USAGE
========================================== */
(async () => {
  // Ava chat
  const avaReply = await getAvaResponse("Is walking safe this week?", calculatePregnancyWeek("2026-01-01"));
  console.log("Ava:", avaReply);

  // Food research
  const bananaInfo = await analyzeFood("banana");
  console.log("Food:", bananaInfo);
})();