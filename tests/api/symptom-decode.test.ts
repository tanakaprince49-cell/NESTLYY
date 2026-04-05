import { mockReq, mockRes } from '../helpers';
import handler from '../../api/symptom-decode.js';

describe('api/symptom-decode', () => {
  it('rejects non-POST with 405', async () => {
    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
    expect(res._body).toEqual({ error: 'Method not allowed' });
  });

  it('returns 500 when OPENROUTER_API_KEY is missing', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const req = mockReq({ body: { symptoms: 'headache', trimester: 'First Trimester' } });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'Missing API key' });
  });

  it('returns analysis JSON on success', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
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

    const req = mockReq({ body: { symptoms: 'headache', trimester: 'First Trimester' } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(analysis);
  });

  it('returns 500 on upstream error', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'service unavailable' }),
    }));

    const req = mockReq({ body: { symptoms: 'nausea', trimester: 'Second Trimester' } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: { error: 'service unavailable' } });
  });

  it('returns empty object when AI returns empty content', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '' } }],
      }),
    }));

    const req = mockReq({ body: { symptoms: 'fatigue', trimester: 'Third Trimester' } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual({});
  });

  it('returns 500 when fetch throws', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection reset')));

    const req = mockReq({ body: { symptoms: 'cramps', trimester: 'First Trimester' } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'connection reset' });
  });
});
