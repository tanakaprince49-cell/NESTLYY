import { mockReq, mockRes } from '../helpers';
import handler from '../../api/js/script.js';

describe('api/js/script', () => {
  it('returns JS with correct content-type and cache headers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'console.log("analytics")',
    }));

    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect(res._headers.get('Content-Type')).toBe('application/javascript');
    expect(res._headers.get('Cache-Control')).toBe('public, max-age=86400, stale-while-revalidate=86400');
    expect(res._body).toBe('console.log("analytics")');
  });

  it('returns upstream body as-is', async () => {
    const jsCode = '!function(){window.plausible=1}()';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => jsCode,
    }));

    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    await handler(req, res);

    expect(res._body).toBe(jsCode);
  });

  it('propagates error when upstream fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('upstream down')));

    const req = mockReq({ method: 'GET' });
    const res = mockRes();

    await expect(handler(req, res)).rejects.toThrow('upstream down');
  });
});
