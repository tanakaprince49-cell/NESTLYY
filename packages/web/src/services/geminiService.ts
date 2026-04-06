/* ==========================================
   AVA – SAFE FRONTEND (NO API KEY)
========================================== */

import { auth } from "@nestly/shared";

const API_URL = "/api/ava";

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
   CORE CALL (TO BACKEND)
========================================== */

async function callAva(messages: any[]) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.reply;
}

/* ==========================================
   PUBLIC CHAT FUNCTION
========================================== */

export async function getAvaResponse(userMessage: string) {
  try {
    let memory = loadMemory();

    memory.push({ role: "user", content: userMessage });

    memory = memory.slice(-6);

    const reply = await callAva(memory);

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
