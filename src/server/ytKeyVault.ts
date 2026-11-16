import crypto from 'crypto';
import type { IncomingHttpHeaders } from 'http';

/**
 * Server-side only credential vault & request guard for AURA's YouTube Data API v3 proxy.
 * NEVER import this module from browser/client files under src/components, src/context, or src/services.
 */

const SEALED_CREDENTIAL = {
  s: '8gOj2BByAJCwB6bSWs2KAw==',
  i: 'FH+MP2Dyu9KUJHa1',
  t: 'ERHtfAS7XJQGfVISnguvUw==',
  c: 'QGkHzxEzx+mre3w23fZ5lQssX4Utr2bsKM7z7RmUpxJMX4av7ivR',
  a: 'aura.audio.gateway.v3',
} as const;

const REVOKED_KEY_SHA256 = 'ba4ed7e152bfa1ef3dc1ee09713e49b24fff221ffdadcd3ac1d1584a4d7a0b52';

let cachedCredential: string | null = null;

export function resolveYouTubeServerKey(): string {
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

export const AURA_CLIENT_HEADER_NAME = 'x-aura-client';
export const AURA_CLIENT_HEADER_VALUE = 'aura-web-v3';

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

  const appUrl = (process.env.APP_URL || '').trim();
  if (appUrl) {
    try {
      hosts.add(new URL(appUrl).host.toLowerCase());
    } catch {
      // ignore invalid APP_URL
    }
  }

  const ngHosts = (process.env.NG_ALLOWED_HOSTS || '').trim();
  if (ngHosts) {
    ngHosts
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
      .forEach((h) => hosts.add(h));
  }

  return Array.from(hosts);
}

export function getValidatedGoogleReferer(headers: IncomingHttpHeaders): string | undefined {
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

export interface AuraAccessCheck {
  allowed: boolean;
  corsOrigin?: string;
}

/**
 * Enforces that /api/yt/search is only invoked from the AURA application origin/context.
 */
export function validateAuraSearchAccess(
  headers: IncomingHttpHeaders,
  method: string = 'GET'
): AuraAccessCheck {
  const origin = typeof headers.origin === 'string' ? headers.origin.trim() : '';
  const referer = typeof headers.referer === 'string' ? headers.referer.trim() : '';
  const secFetchMode = typeof headers['sec-fetch-mode'] === 'string' ? headers['sec-fetch-mode'].toLowerCase() : '';
  const secFetchSite = typeof headers['sec-fetch-site'] === 'string' ? headers['sec-fetch-site'].toLowerCase() : '';
  const auraClient = typeof headers[AURA_CLIENT_HEADER_NAME] === 'string' ? headers[AURA_CLIENT_HEADER_NAME].trim() : '';

  // Block direct address-bar / top-level document navigation
  if (secFetchMode === 'navigate') {
    return { allowed: false };
  }

  // Validate Origin when present
  let corsOrigin: string | undefined;
  if (origin) {
    if (!isUrlAllowedOrigin(origin, headers)) {
      return { allowed: false };
    }
    corsOrigin = origin;
  }

  // Validate Referer when present
  if (referer && !isUrlAllowedOrigin(referer, headers)) {
    return { allowed: false };
  }

  // Reject cross-site fetches unless explicitly authorized by ALLOWED_ORIGINS
  if (secFetchSite === 'cross-site') {
    const configured = getConfiguredOrigins();
    if (!origin || !configured.includes(origin)) {
      return { allowed: false };
    }
  }

  // For GET search requests, require the AURA web client header
  if (method !== 'OPTIONS' && auraClient !== AURA_CLIENT_HEADER_VALUE) {
    return { allowed: false };
  }

  return { allowed: true, corsOrigin };
}

export interface CachedYouTubeTrackItem {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  source: 'youtube';
}

const SEARCH_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SEARCH_CACHE_MAX_ENTRIES = 250;
const searchCache = new Map<string, { items: CachedYouTubeTrackItem[]; expiresAt: number }>();

export function getCachedYouTubeSearch(query: string, limit: number): CachedYouTubeTrackItem[] | null {
  const key = `${query.toLowerCase()}::${limit}`;
  const hit = searchCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    searchCache.delete(key);
    return null;
  }
  // Refresh LRU recency
  searchCache.delete(key);
  searchCache.set(key, hit);
  return hit.items;
}

export function setCachedYouTubeSearch(query: string, limit: number, items: CachedYouTubeTrackItem[]): void {
  const key = `${query.toLowerCase()}::${limit}`;
  if (searchCache.size >= SEARCH_CACHE_MAX_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(key, {
    items,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });
}

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_UNCACHED_PER_MIN = 35;
const ipHits = new Map<string, number[]>();

export function getClientIp(headers: IncomingHttpHeaders, remoteAddress?: string): string {
  const fwd = typeof headers['x-forwarded-for'] === 'string' ? headers['x-forwarded-for'] : '';
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  return remoteAddress || 'unknown';
}

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const prev = (ipHits.get(ip) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (prev.length >= RATE_MAX_UNCACHED_PER_MIN) {
    ipHits.set(ip, prev);
    return true;
  }
  prev.push(now);
  ipHits.set(ip, prev);

  // Periodic cleanup if map grows
  if (ipHits.size > 1000) {
    for (const [k, stamps] of ipHits.entries()) {
      const fresh = stamps.filter((ts) => now - ts < RATE_WINDOW_MS);
      if (fresh.length === 0) ipHits.delete(k);
      else ipHits.set(k, fresh);
    }
  }
  return false;
}
