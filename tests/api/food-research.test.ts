import { mockReq, mockRes } from '../helpers';
import handler from '../../api/food-research.js';

describe('api/food-research', () => {
  it('rejects non-POST with 405', async () => {
    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
    expect(res._body).toEqual({ error: 'Method not allowed' });
  });

  it('returns 400 when foodName is missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body).toEqual({ error: 'Food name is required' });
  });

  it('returns 500 when OPENROUTER_API_KEY is missing', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const req = mockReq({ body: { foodName: 'banana' } });
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'Missing API key' });
  });

  it('returns 500 on upstream error', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'upstream error',
    }));

    const req = mockReq({ body: { foodName: 'banana' } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'upstream error' });
  });

  it('returns nutrition JSON on success', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const nutrition = { explanation: 'A fruit', calories: 105, protein: 1.3, folate: 24, iron: 0.3, calcium: 6 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(nutrition) } }],
      }),
    }));

    const req = mockReq({ body: { foodName: 'banana' } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(nutrition);
  });

  it('strips markdown fences from response', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const nutrition = { explanation: 'Eggs', calories: 155 };
    const wrapped = '```json\n' + JSON.stringify(nutrition) + '\n```';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: wrapped } }],
      }),
    }));

    const req = mockReq({ body: { foodName: 'eggs' } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(nutrition);
  });

  it('strips fences without json tag', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const nutrition = { explanation: 'Rice', calories: 206 };
    const wrapped = '```\n' + JSON.stringify(nutrition) + '\n```';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: wrapped } }],
      }),
    }));

    const req = mockReq({ body: { foodName: 'rice' } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._body).toEqual(nutrition);
  });

  it('returns 500 when fetch throws', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));

    const req = mockReq({ body: { foodName: 'banana' } });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'timeout' });
  });
});
