/* ==========================================
   AVA – Fast, Short, Smart, With Memory + Voice
========================================== */

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
   PUBLIC CHAT FUNCTION (With Memory)
========================================== */

export async function getAvaResponse(userMessage: string) {
  try {
    let memory = loadMemory();

    // Add new user message
    memory.push({ role: "user", content: userMessage });

    // Keep only last 6 messages (faster)
    memory = memory.slice(-6);

    // Format for Gemini
    const contents = memory.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: `You are Ava, a pregnancy companion.
Be VERY concise.
Max 2-3 short sentences.
Warm but direct.
No long explanations.`,
        temperature: 0.5,
      }
    });

    const reply = response.text || "Hmm… I’m reconnecting 💕";

    // Save assistant reply
    memory.push({ role: "assistant", content: reply });
    saveMemory(memory);

    return reply;

  } catch (error) {
    console.error("Ava Error:", error);
    return "Hmm… I’m reconnecting 💕";
  }
}

/* ==========================================
   VOICE: TEXT → SPEECH
========================================== */

export function speak(text: string) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  speech.rate = 1.0;
  speech.pitch = 1.1; // slightly higher pitch for a warmer tone
  window.speechSynthesis.speak(speech);
}

/* ==========================================
   VOICE: SPEECH → TEXT
========================================== */

export function listen(callback: (text: string) => void) {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    callback(transcript);
  };
}
