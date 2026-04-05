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

import handler from '../../api/symptom-decode.js';

describe('api/symptom-decode', () => {
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
      body: { symptoms: 'headache', trimester: 'First Trimester' },
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
      body: { symptoms: 'headache', trimester: 'First Trimester' },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'Missing API key' });
  });

  // -- Happy path --

  it('returns analysis JSON on success', async () => {
    const analysis = {
      validation: 'Headaches are common',
      safetyRating: 'Green',
      explanation: 'Hormonal changes',
      action: 'Stay hydrated',
      medicalNote: 'See doctor if persistent',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(analysis) } }],
      }),
    }));

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { symptoms: 'headache', trimester: 'First Trimester' },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(analysis);
  });

  // -- Upstream errors --

  it('returns 500 on upstream error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'service unavailable' }),
    }));

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { symptoms: 'nausea', trimester: 'Second Trimester' },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: { error: 'service unavailable' } });
  });

  it('returns empty object when AI returns empty content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '' } }],
      }),
    }));

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { symptoms: 'fatigue', trimester: 'Third Trimester' },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual({});
  });

  it('returns 500 when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection reset')));

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { symptoms: 'cramps', trimester: 'First Trimester' },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'connection reset' });
  });
});
