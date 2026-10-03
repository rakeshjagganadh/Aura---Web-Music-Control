import type { IncomingMessage, ServerResponse } from 'http';

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
}

export default function handler(_req: IncomingMessage, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(200).json({ status: 'ok', runtime: 'vercel', timestamp: new Date().toISOString() });
  } else {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ok', runtime: 'vercel', timestamp: new Date().toISOString() }));
  }
}
