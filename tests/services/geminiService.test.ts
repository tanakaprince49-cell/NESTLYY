import { mockLocalStorage } from '../helpers';

let ls: ReturnType<typeof mockLocalStorage>;

beforeEach(() => {
  ls = mockLocalStorage();
  vi.stubGlobal('localStorage', ls);
});

// Import after mocks are set up
import { getAvaResponse } from '../../services/geminiService.ts';

describe('getAvaResponse', () => {
  it('sends user message to /api/ava and returns reply', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'Hello!' }),
    }));

    const reply = await getAvaResponse('hi');

    expect(reply).toBe('Hello!');
    expect(fetch).toHaveBeenCalledWith('/api/ava', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('sends correct payload structure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'Ok' }),
    }));

    await getAvaResponse('test message');

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body).toHaveProperty('messages');
    expect(body.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'test message' }),
      ]),
    );
  });

  it('appends assistant reply to memory in localStorage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'I am Ava' }),
    }));

    await getAvaResponse('who are you');

    const memory = JSON.parse(ls.getItem('ava_memory')!);
    expect(memory).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: 'user', content: 'who are you' }),
      expect.objectContaining({ role: 'assistant', content: 'I am Ava' }),
    ]));
  });

  it('trims memory to last 6 messages', async () => {
    // Seed with 6 existing messages
    const existing = Array.from({ length: 6 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg-${i}`,
    }));
    ls.setItem('ava_memory', JSON.stringify(existing));

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'reply-7' }),
    }));

    await getAvaResponse('msg-7');

    const memory = JSON.parse(ls.getItem('ava_memory')!);
    // 6 existing + 1 new user = 7, trimmed to 6, then + 1 assistant reply = 7 stored
    // But the trim happens before the API call, so: slice(-6) of 7 = 6 sent, then reply appended = 7 stored
    expect(memory.length).toBeLessThanOrEqual(7);
    // First message should NOT be msg-0 (it was trimmed)
    expect(memory[0].content).not.toBe('msg-0');
  });

  it('does not trim when memory has fewer than 6 messages', async () => {
    const existing = [
      { role: 'user', content: 'a' },
      { role: 'assistant', content: 'b' },
    ];
    ls.setItem('ava_memory', JSON.stringify(existing));

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'c' }),
    }));

    await getAvaResponse('d');

    const memory = JSON.parse(ls.getItem('ava_memory')!);
    expect(memory[0].content).toBe('a');
    expect(memory).toHaveLength(4);
  });

  it('returns fallback message on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

    const reply = await getAvaResponse('hello');

    expect(reply).toContain('reconnecting');
  });

  it('loads existing memory from localStorage', async () => {
    const existing = [{ role: 'user', content: 'previous' }];
    ls.setItem('ava_memory', JSON.stringify(existing));

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'yes' }),
    }));

    await getAvaResponse('new');

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    const messages = body.messages;
    expect(messages.some((m: any) => m.content === 'previous')).toBe(true);
    expect(messages.some((m: any) => m.content === 'new')).toBe(true);
  });
});
