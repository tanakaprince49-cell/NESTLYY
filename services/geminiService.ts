/* ==========================================
   AVA – Fast, Short, Smart, With Memory + Voice
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
   CORE FAST CALL
========================================== */

async function callAva(messages: any[]) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://nestly.app",
      "X-Title": "Ava AI",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `
You are Ava, a pregnancy companion.
Be VERY concise.
Max 2-3 short sentences.
Warm but direct.
No long explanations.
`,
        },
        ...messages,
      ],
      temperature: 0.5,
      max_tokens: 120,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.choices[0].message.content;
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

    const reply = await callAva(memory);

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

  if (!SpeechRecognition) {
    console.error("Speech Recognition not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    callback(transcript);
  };
}
