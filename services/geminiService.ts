import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: "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",
  dangerouslyAllowBrowser: true // Required for client-side usage
});

const MEMORY_KEY = "ava_memory";

function saveMemory(messages: any[]) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(messages));
}

function loadMemory() {
  const memory = localStorage.getItem(MEMORY_KEY);
  return memory ? JSON.parse(memory) : [];
}

export async function getAvaResponse(userMessage: string) {
  try {
    let memory = loadMemory();
    memory.push({ role: "user", content: userMessage });
    memory = memory.slice(-6);

    // Stream the response to get reasoning tokens in usage
    const stream = await openrouter.chat.send({
      model: "google/gemini-3-flash-preview",
      messages: memory,
      stream: true
    });

    let response = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        response += content;
        // Replaced process.stdout.write with console.log for browser compatibility
        console.log(content);
      }

      // Usage information comes in the final chunk
      if (chunk.usage) {
        console.log("\nReasoning tokens:", chunk.usage.reasoningTokens);
      }
    }

    memory.push({ role: "assistant", content: response });
    saveMemory(memory);

    return response || "Hmm… I’m reconnecting 💕";
  } catch (error) {
    console.error("Ava Error:", error);
    return "Hmm… I’m reconnecting 💕";
  }
}

export function speak(text: string) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  speech.rate = 1.0;
  speech.pitch = 1.1;
  window.speechSynthesis.speak(speech);
}

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
