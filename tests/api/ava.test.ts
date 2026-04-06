import { mockReq, mockRes } from '../helpers';

// Mock firebase-admin dynamic imports
const mockVerifyIdToken = vi.fn();
const mockGetApps = vi.fn().mockReturnValue([{ name: 'test' }]);

vi.mock('firebase-admin/app', () => ({
  getApps: mockGetApps,
  initializeApp: vi.fn(),
  cert: vi.fn(),
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: mockVerifyIdToken }),
}));

import handler from '../../api/ava.js';

describe('api/ava', () => {
  beforeEach(() => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'test-user' });
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
  });

  // -- Method guard --

  it('rejects non-POST with 405', async () => {
    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
    expect(res._body).toEqual({ error: 'Method not allowed' });
  });

  // -- Auth --

  it('returns 401 when Authorization header is missing', async () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(401);
    expect(res._body).toEqual({ error: 'Missing authorization token' });
  });

  it('returns 401 when Authorization header has wrong format', async () => {
    const req = mockReq({ headers: { authorization: 'Token abc' } });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(401);
    expect(res._body).toEqual({ error: 'Missing authorization token' });
  });

  it('returns 401 when token verification fails', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('invalid token'));
    const req = mockReq({
      headers: { authorization: 'Bearer bad-token' },
      body: { messages: [{ role: 'user', content: 'hi' }] },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(401);
    expect(res._body).toEqual({ error: 'Invalid authorization token' });
  });

  // -- Env --

  it('returns 500 when OPENROUTER_API_KEY is missing', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { messages: [{ role: 'user', content: 'hi' }] },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'Missing API key' });
  });

  // -- Happy path --

  it('returns reply on successful call', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello from Ava!' } }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { messages: [{ role: 'user', content: 'hi' }] },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual({ reply: 'Hello from Ava!' });
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  // -- Upstream errors --

  it('returns 500 on upstream error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'rate limited' }),
    }));

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { messages: [] },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: { error: 'rate limited' } });
  });

  it('returns "No response" when choices is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    }));

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { messages: [] },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual({ reply: 'No response' });
  });

  it('returns 500 with message when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { messages: [] },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'network down' });
  });
});
