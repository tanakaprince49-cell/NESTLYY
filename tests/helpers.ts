export function mockReq(overrides: Record<string, any> = {}) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...overrides.headers },
    body: overrides.body ?? {},
    query: overrides.query ?? {},
    ...overrides,
  };
}

export function mockRes() {
  const res: Record<string, any> = {
    _status: 200,
    _body: null,
    _headers: new Map<string, string>(),
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: any) {
      res._body = data;
      return res;
    },
    send(data: any) {
      res._body = data;
      return res;
    },
    setHeader(key: string, value: string) {
      res._headers.set(key, value);
      return res;
    },
  };
  return res;
}
