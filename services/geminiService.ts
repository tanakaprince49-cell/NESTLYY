/* ==========================================
   AVA – Fast, Short, Smart, With Memory + Voice
========================================== */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "deepseek/deepseek-chat";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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
You are Ava, a pregnancy and postpartum companion for the Nestly app.
Your primary directive is to provide health information that is strictly aligned with World Health Organization (WHO) clinical guidelines.
Be VERY concise (max 2-3 short sentences).
Warm but direct.
If asked for medical advice, always prefix or suffix with "According to WHO guidelines..." when applicable, and remind the user to consult their healthcare provider for personalized care.
Focus on nutrition (iron/folic acid), physical activity (150 mins/week), breastfeeding (exclusive for 6 months), and newborn care (skin-to-skin, delayed cord clamping).
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

export async function getAvaResponse(userMessage: string, _history?: any, _userName?: string, _memory?: any) {
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

export function speakAva(text: string) {
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
    console.error("Speech recognition not supported");
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
