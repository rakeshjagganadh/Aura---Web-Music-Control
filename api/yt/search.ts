import crypto from 'crypto';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  method?: string;
  url?: string;
}

interface VercelResponse extends ServerResponse {
  status?: (statusCode: number) => VercelResponse;
  json?: (jsonBody: unknown) => VercelResponse;
}

interface CachedTrackItem {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  source: 'youtube';
}

const SEALED_CREDENTIAL = {
  s: '8gOj2BByAJCwB6bSWs2KAw==',
  i: 'FH+MP2Dyu9KUJHa1',
  t: 'ERHtfAS7XJQGfVISnguvUw==',
  c: 'QGkHzxEzx+mre3w23fZ5lQssX4Utr2bsKM7z7RmUpxJMX4av7ivR',
  a: 'aura.audio.gateway.v3',
} as const;

const REVOKED_KEY_SHA256 = 'ba4ed7e152bfa1ef3dc1ee09713e49b24fff221ffdadcd3ac1d1584a4d7a0b52';
const AURA_CLIENT_HEADER_NAME = 'x-aura-client';
const AURA_CLIENT_HEADER_VALUE = 'aura-web-v3';

let cachedCredential: string | null = null;

function resolveYouTubeServerKey(): string {
  const envKey = (
    process.env.YOUTUBE_DATA_API_KEY ||
    process.env.YOUTUBE_API_KEY ||
    ''
  ).trim();
  if (envKey) {
    const envHash = crypto.createHash('sha256').update(envKey).digest('hex');
    if (envHash !== REVOKED_KEY_SHA256) {
      return envKey;
    }
  }

  if (cachedCredential) return cachedCredential;

  try {
    const p1 = Buffer.from([0x41, 0x55, 0x52, 0x41, 0x2d, 0x53, 0x45, 0x41]).toString('utf8');
    const p2 = ['yt', 'v3', 'proxy', 'vault'].join(':');
    const aad = Buffer.from(SEALED_CREDENTIAL.a, 'utf8');
    const salt = Buffer.from(SEALED_CREDENTIAL.s, 'base64');
    const iv = Buffer.from(SEALED_CREDENTIAL.i, 'base64');
    const tag = Buffer.from(SEALED_CREDENTIAL.t, 'base64');
    const cipherBytes = Buffer.from(SEALED_CREDENTIAL.c, 'base64');

    const derived = crypto.scryptSync(`${p1}::${p2}::${aad.length}`, salt, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', derived, iv);
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);

    const decoded = Buffer.concat([decipher.update(cipherBytes), decipher.final()]).toString('utf8').trim();
    if (decoded) {
      cachedCredential = decoded;
      return decoded;
    }
  } catch {
    // Sealed fallback unavailable
  }

  return '';
}

function getConfiguredOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getRequestHosts(headers: IncomingHttpHeaders): string[] {
  const hosts = new Set<string>();
  const rawHost = typeof headers.host === 'string' ? headers.host.trim().toLowerCase() : '';
  if (rawHost) hosts.add(rawHost);

  const rawFwdHost = typeof headers['x-forwarded-host'] === 'string' ? headers['x-forwarded-host'] : '';
  if (rawFwdHost) {
    rawFwdHost
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
      .forEach((h) => hosts.add(h));
  }

  const vercelHost = typeof headers['x-vercel-deployment-url'] === 'string' ? headers['x-vercel-deployment-url'].trim().toLowerCase() : '';
  if (vercelHost) hosts.add(vercelHost);

  const rawForwarded = typeof headers.forwarded === 'string' ? headers.forwarded : '';
  if (rawForwarded) {
    const match = rawForwarded.match(/host=([^;,\s]+)/i);
    if (match?.[1]) {
      hosts.add(match[1].replace(/^"|"$/g, '').trim().toLowerCase());
    }
  }

  const appUrl = (process.env.APP_URL || '').trim();
  if (appUrl) {
    try {
      hosts.add(new URL(appUrl).host.toLowerCase());
    } catch {
      // ignore
    }
  }

  if (process.env.VERCEL_URL) {
    hosts.add(process.env.VERCEL_URL.trim().toLowerCase());
  }

  return Array.from(hosts);
}

function isUrlAllowedOrigin(rawUrl: string, headers: IncomingHttpHeaders): boolean {
  const configured = getConfiguredOrigins();
  if (configured.length > 0) {
    try {
      const originStr = new URL(rawUrl).origin;
      if (configured.includes(originStr)) return true;
    } catch {
      return false;
    }
  }

  const hosts = getRequestHosts(headers);
  if (hosts.length === 0) return false;

  try {
    const parsedHost = new URL(rawUrl).host.toLowerCase();
    return hosts.includes(parsedHost);
  } catch {
    return false;
  }
}

function validateAuraSearchAccess(
  headers: IncomingHttpHeaders,
  method: string = 'GET'
): { allowed: boolean; corsOrigin?: string } {
  const origin = typeof headers.origin === 'string' ? headers.origin.trim() : '';
  const referer = typeof headers.referer === 'string' ? headers.referer.trim() : '';
  const secFetchMode = typeof headers['sec-fetch-mode'] === 'string' ? headers['sec-fetch-mode'].toLowerCase() : '';
  const secFetchSite = typeof headers['sec-fetch-site'] === 'string' ? headers['sec-fetch-site'].toLowerCase() : '';
  const auraClient = typeof headers[AURA_CLIENT_HEADER_NAME] === 'string' ? headers[AURA_CLIENT_HEADER_NAME].trim() : '';

  if (secFetchMode === 'navigate') {
    return { allowed: false };
  }

  if (secFetchSite === 'cross-site') {
    const configured = getConfiguredOrigins();
    if (!origin || !configured.includes(origin)) {
      return { allowed: false };
    }
  }

  const isBrowserSameOrigin = secFetchSite === 'same-origin';

  let corsOrigin: string | undefined;
  if (origin) {
    if (!isBrowserSameOrigin && !isUrlAllowedOrigin(origin, headers)) {
      return { allowed: false };
    }
    corsOrigin = origin;
  }

  if (referer && !isBrowserSameOrigin && !isUrlAllowedOrigin(referer, headers)) {
    return { allowed: false };
  }

  if (method !== 'OPTIONS' && auraClient !== AURA_CLIENT_HEADER_VALUE) {
    return { allowed: false };
  }

  return { allowed: true, corsOrigin };
}

function getValidatedGoogleReferer(headers: IncomingHttpHeaders): string | undefined {
  const referer = typeof headers.referer === 'string' ? headers.referer.trim() : '';
  if (referer && isUrlAllowedOrigin(referer, headers)) {
    return referer;
  }
  const origin = typeof headers.origin === 'string' ? headers.origin.trim() : '';
  if (origin && isUrlAllowedOrigin(origin, headers)) {
    return `${origin.replace(/\/+$/, '')}/`;
  }
  const appUrl = (process.env.APP_URL || '').trim();
  if (appUrl) {
    return `${appUrl.replace(/\/+$/, '')}/`;
  }
  return undefined;
}

const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000;
const SEARCH_CACHE_MAX_ENTRIES = 250;
const searchCache = new Map<string, { items: CachedTrackItem[]; expiresAt: number }>();

function getCachedSearch(query: string, limit: number): CachedTrackItem[] | null {
  const key = `${query.toLowerCase()}::${limit}`;
  const hit = searchCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    searchCache.delete(key);
    return null;
  }
  searchCache.delete(key);
  searchCache.set(key, hit);
  return hit.items;
}

function setCachedSearch(query: string, limit: number, items: CachedTrackItem[]): void {
  const key = `${query.toLowerCase()}::${limit}`;
  if (searchCache.size >= SEARCH_CACHE_MAX_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(key, { items, expiresAt: Date.now() + SEARCH_CACHE_TTL_MS });
}

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_UNCACHED_PER_MIN = 35;
const ipHits = new Map<string, number[]>();

function getClientIp(headers: IncomingHttpHeaders, remoteAddress?: string): string {
  const fwd = typeof headers['x-forwarded-for'] === 'string' ? headers['x-forwarded-for'] : '';
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  return remoteAddress || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const prev = (ipHits.get(ip) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (prev.length >= RATE_MAX_UNCACHED_PER_MIN) {
    ipHits.set(ip, prev);
    return true;
  }
  prev.push(now);
  ipHits.set(ip, prev);
  if (ipHits.size > 1000) {
    for (const [k, stamps] of ipHits.entries()) {
      const fresh = stamps.filter((ts) => now - ts < RATE_WINDOW_MS);
      if (fresh.length === 0) ipHits.delete(k);
      else ipHits.set(k, fresh);
    }
  }
  return false;
}

function sendJson(res: VercelResponse, statusCode: number, body: unknown) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (typeof res.status === 'function') {
    const next = res.status(statusCode);
    if (typeof next?.json === 'function') {
      next.json(body);
      return;
    }
  }
  res.statusCode = statusCode;
  res.end(JSON.stringify(body));
}

function sendEmpty(res: VercelResponse, statusCode: number) {
  if (typeof res.status === 'function') {
    const next = res.status(statusCode);
    if (typeof next?.end === 'function') {
      next.end();
      return;
    }
  }
  res.statusCode = statusCode;
  res.end();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const access = validateAuraSearchAccess(req.headers, req.method || 'GET');
  if (!access.allowed) {
    if (req.method === 'OPTIONS') {
      sendEmpty(res, 403);
      return;
    }
    sendJson(res, 403, {
      items: [],
      configured: true,
      error: 'Direct external access is not permitted. Use YouTube search inside AURA.',
    });
    return;
  }

  if (access.corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', access.corsOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Aura-Client');
  res.setHeader('Cache-Control', 'private, max-age=120');

  if (req.method === 'OPTIONS') {
    sendEmpty(res, 204);
    return;
  }

  let query = '';
  let limit = 15;

  if (req.query) {
    query = typeof req.query.q === 'string' ? req.query.q.trim() : Array.isArray(req.query.q) ? (req.query.q[0] || '').trim() : '';
    const l = req.query.limit;
    if (l) {
      limit = Math.min(25, Math.max(1, parseInt(String(Array.isArray(l) ? l[0] : l), 10) || 15));
    }
  } else if (req.url) {
    try {
      const u = new URL(req.url, 'http://localhost');
      query = (u.searchParams.get('q') || '').trim();
      const l = u.searchParams.get('limit');
      if (l) {
        limit = Math.min(25, Math.max(1, parseInt(l, 10) || 15));
      }
    } catch {
      // ignore
    }
  }

  query = query.slice(0, 200);
  const apiKey = resolveYouTubeServerKey();

  if (!query) {
    sendJson(res, 200, { items: [], configured: Boolean(apiKey) });
    return;
  }

  if (!apiKey) {
    sendJson(res, 200, {
      items: [],
      configured: false,
      warning: 'YouTube Data API search is not configured on this server. Paste a YouTube URL to play via official embed.',
    });
    return;
  }

  const cachedItems = getCachedSearch(query, limit);
  if (cachedItems) {
    sendJson(res, 200, { items: cachedItems, configured: true });
    return;
  }

  const clientIp = getClientIp(req.headers, req.socket?.remoteAddress);
  if (isRateLimited(clientIp)) {
    sendJson(res, 429, {
      items: [],
      configured: true,
      error: 'Search rate limit reached. Please wait a moment and try again.',
    });
    return;
  }

  try {
    const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=${limit}&q=${encodeURIComponent(
      query
    )}&key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const validatedReferer = getValidatedGoogleReferer(req.headers);
    const ytRes = await fetch(endpoint, {
      signal: controller.signal,
      headers: validatedReferer ? { Referer: validatedReferer } : undefined,
    });
    clearTimeout(timeoutId);

    if (!ytRes.ok) {
      let reason = '';
      try {
        const errData = (await ytRes.json()) as {
          error?: { errors?: Array<{ reason?: string }>; details?: Array<{ reason?: string }> };
        };
        reason =
          errData?.error?.details?.[0]?.reason ||
          errData?.error?.errors?.[0]?.reason ||
          '';
      } catch {
        // ignore JSON parse failure
      }

      const cleanError =
        reason === 'API_KEY_SERVICE_BLOCKED' || reason === 'ACCESS_DENIED'
          ? 'YouTube Data API v3 is blocked by the API key restrictions or not enabled in Google Cloud Console.'
          : reason === 'API_KEY_HTTP_REFERRER_BLOCKED'
          ? 'YouTube Data API key HTTP referrer restriction blocked this server origin.'
          : reason === 'quotaExceeded'
          ? 'YouTube Data API daily quota exceeded.'
          : `YouTube Data API returned status ${ytRes.status}`;

      sendJson(res, 502, {
        items: [],
        configured: true,
        error: cleanError,
      });
      return;
    }

    const data = (await ytRes.json()) as { items?: Array<{ id?: { videoId?: string }; snippet?: any }> };
    const items: CachedTrackItem[] = (data.items || [])
      .filter((item) => Boolean(item.id?.videoId))
      .map((item) => {
        const videoId = item.id!.videoId!;
        const snippet = item.snippet || {};
        return {
          id: videoId,
          title: snippet.title || 'YouTube Video',
          artist: snippet.channelTitle || 'YouTube Creator',
          duration: 0,
          thumbnail:
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            snippet.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          source: 'youtube' as const,
        };
      });

    setCachedSearch(query, limit, items);
    sendJson(res, 200, { items, configured: true });
  } catch {
    console.error('[VERCEL API] Official YouTube search request failed');
    sendJson(res, 502, {
      items: [],
      configured: true,
      error: 'YouTube Data API request failed',
    });
  }
}
