import { mockReq, mockRes } from '../helpers';
import handler from '../../api/ava.js';

describe('api/ava', () => {
  it('rejects non-POST with 405', async () => {
    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
    expect(res._body).toEqual({ error: 'Method not allowed' });
  });

  it('returns 500 when OPENROUTER_API_KEY is missing', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const req = mockReq({ body: { messages: [{ role: 'user', content: 'hi' }] } });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'Missing API key' });
  });

  it('returns reply on successful call', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello from Ava!' } }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const req = mockReq({ body: { messages: [{ role: 'user', content: 'hi' }] } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual({ reply: 'Hello from Ava!' });
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('returns 500 on upstream error', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'rate limited' }),
    }));

    const req = mockReq({ body: { messages: [] } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: { error: 'rate limited' } });
  });

  it('returns "No response" when choices is empty', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    }));

    const req = mockReq({ body: { messages: [] } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual({ reply: 'No response' });
  });

  it('returns 500 with message when fetch throws', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const req = mockReq({ body: { messages: [] } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'network down' });
  });
});
