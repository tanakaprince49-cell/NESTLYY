import { auth } from '@nestly/shared';
import type { ChatMessage } from '@nestly/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL}/api/ava`
  : 'https://nestlyy-one.vercel.app/api/ava';

export async function getAvaResponse(
  userMessage: string,
  recentMessages: ChatMessage[],
): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Map local ChatMessage format to API format (last 6 messages for context)
  const history = recentMessages.slice(-6).map((m) => ({
    role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
    content: m.text,
  }));
  history.push({ role: 'user', content: userMessage });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages: history }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      throw new Error(text);
    }

    const data = await response.json();
    return data.reply || 'No response';
  } finally {
    clearTimeout(timeout);
  }
}
