import { EventEmitter } from 'node:events';

export interface TestResponse<T = any> {
  status: number;
  body: T;
  headers: Record<string, string>;
}

export function testRequest<T = any>(
  app: any,
  method: string,
  url: string,
  options: { headers?: Record<string, string>; body?: any } = {}
): Promise<TestResponse<T>> {
  return new Promise((resolve) => {
    const req: any = new EventEmitter();
    req.method = method.toUpperCase();
    req.url = url;
    req.originalUrl = url;
    const normalizedHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(options.headers || {})) {
      normalizedHeaders[k.toLowerCase()] = String(v);
    }
    req.headers = normalizedHeaders;
    req.ip = '127.0.0.1';
    req.connection = { remoteAddress: '127.0.0.1' };
    req.socket = { remoteAddress: '127.0.0.1' };
    req.query = {};
    req.params = {};

    // Parse query params from url if present
    if (url.includes('?')) {
      const queryString = url.split('?')[1];
      const searchParams = new URLSearchParams(queryString);
      for (const [key, val] of searchParams.entries()) {
        req.query[key] = val;
      }
    }

    if (options.body !== undefined) {
      req.body = options.body;
      req.headers['content-type'] = 'application/json';
    }

    const resHeaders: Record<string, string> = {};
    const res: any = new EventEmitter();
    res.statusCode = 200;

    res.setHeader = (key: string, val: any) => {
      resHeaders[key.toLowerCase()] = String(val);
      return res;
    };

    res.getHeader = (key: string) => resHeaders[key.toLowerCase()];

    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };

    res.writeHead = (code: number, headers?: any) => {
      res.statusCode = code;
      if (headers) {
        for (const [k, v] of Object.entries(headers)) {
          resHeaders[k.toLowerCase()] = String(v);
        }
      }
      return res;
    };

    let responseData = '';
    res.write = (chunk: any) => {
      if (chunk) responseData += chunk.toString();
      return true;
    };

    res.end = (chunk: any) => {
      if (chunk) responseData += chunk.toString();
      let parsedBody = responseData;
      try {
        parsedBody = JSON.parse(responseData);
      } catch {}
      resolve({
        status: res.statusCode,
        body: parsedBody as T,
        headers: resHeaders,
      });
    };

    res.json = (obj: any) => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(obj));
    };

    res.send = (val: any) => {
      if (typeof val === 'object') {
        res.json(val);
      } else {
        res.end(String(val));
      }
    };

    app.handle(req, res);
  });
}
