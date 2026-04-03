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

import handler from '../../api/custom-plan.js';

describe('api/custom-plan', () => {
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
      body: { trimester: 'First Trimester', dietPreference: 'normal' },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(401);
    expect(res._body).toEqual({ error: 'Invalid authorization token' });
  });

  // -- Input validation --

  it('returns 400 when trimester is missing', async () => {
    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { dietPreference: 'normal' },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body).toEqual({ error: 'Trimester and dietPreference are required' });
  });

  it('returns 400 when dietPreference is missing', async () => {
    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { trimester: 'First Trimester' },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body).toEqual({ error: 'Trimester and dietPreference are required' });
  });

  it('returns 400 for invalid trimester value', async () => {
    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { trimester: 'Fourth Trimester', dietPreference: 'normal' },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body).toEqual({ error: 'Invalid trimester value' });
  });

  it('returns 400 for invalid diet value', async () => {
    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { trimester: 'First Trimester', dietPreference: 'keto' },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body).toEqual({ error: 'Invalid diet preference value' });
  });

  // -- Env --

  it('returns 500 when OPENROUTER_API_KEY is missing', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { trimester: 'First Trimester', dietPreference: 'normal' },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'Missing API key' });
  });

  // -- Upstream errors --

  it('returns 500 on upstream OpenRouter error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'rate limit exceeded',
    }));

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { trimester: 'First Trimester', dietPreference: 'normal' },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'AI service error' });
  });

  it('returns 500 when AI returns empty content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '' } }] }),
    }));

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { trimester: 'Second Trimester', dietPreference: 'vegan' },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'Empty AI response' });
  });

  it('returns 500 when AI response is missing required keys', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"nutrition": {}}' } }],
      }),
    }));

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { trimester: 'First Trimester', dietPreference: 'normal' },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'Incomplete AI response' });
  });

  // -- Happy path --

  it('returns plan JSON on success', async () => {
    const plan = {
      nutrition: { breakfast: ['Oatmeal'], lunch: ['Salad'], dinner: ['Soup'], snacks: ['Apple'], nutrients: [] },
      fitness: { exercises: ['Walking'], safety: ['Stay hydrated'], frequency: 'Daily' },
      routine: { morning: ['Stretch'], afternoon: ['Rest'], evening: ['Read'] },
      medical: { upcoming: ['Ultrasound'], questions: ['Ask about vitamins'] },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(plan) } }],
      }),
    }));

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { trimester: 'First Trimester', dietPreference: 'normal' },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(plan);
  });

  it('truncates additionalInfo to 500 characters', async () => {
    const longInfo = 'a'.repeat(600);
    const plan = {
      nutrition: { breakfast: [], lunch: [], dinner: [], snacks: [], nutrients: [] },
      fitness: { exercises: [], safety: [], frequency: '' },
      routine: { morning: [], afternoon: [], evening: [] },
      medical: { upcoming: [], questions: [] },
    };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(plan) } }],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const req = mockReq({
      headers: { authorization: 'Bearer valid' },
      body: { trimester: 'First Trimester', dietPreference: 'normal', additionalInfo: longInfo },
    });
    const res = mockRes();
    await handler(req, res);

    // Verify the fetch was called and additionalInfo in the prompt is truncated
    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMsg = fetchBody.messages[1].content;
    expect(userMsg).not.toContain('a'.repeat(501));
    expect(res._status).toBe(200);
  });
});
