import type { IncomingMessage, ServerResponse } from 'http';
import {
  resolveYouTubeServerKey,
  validateAuraSearchAccess,
  getValidatedGoogleReferer,
  getCachedYouTubeSearch,
  setCachedYouTubeSearch,
  getClientIp,
  isRateLimited,
  type CachedYouTubeTrackItem,
} from '../../src/server/ytKeyVault';

interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  method?: string;
  url?: string;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (jsonBody: unknown) => VercelResponse;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const access = validateAuraSearchAccess(req.headers, req.method || 'GET');
  if (!access.allowed) {
    if (req.method === 'OPTIONS') {
      res.status(403).end();
      return;
    }
    res.status(403).json({
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
    res.status(204).end();
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
    res.status(200).json({ items: [], configured: Boolean(apiKey) });
    return;
  }

  if (!apiKey) {
    res.status(200).json({
      items: [],
      configured: false,
      warning: 'YouTube Data API search is not configured on this server. Paste a YouTube URL to play via official embed.',
    });
    return;
  }

  const cachedItems = getCachedYouTubeSearch(query, limit);
  if (cachedItems) {
    res.status(200).json({ items: cachedItems, configured: true });
    return;
  }

  const clientIp = getClientIp(req.headers, req.socket?.remoteAddress);
  if (isRateLimited(clientIp)) {
    res.status(429).json({
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

      res.status(502).json({
        items: [],
        configured: true,
        error: cleanError,
      });
      return;
    }

    const data = (await ytRes.json()) as { items?: Array<{ id?: { videoId?: string }; snippet?: any }> };
    const items: CachedYouTubeTrackItem[] = (data.items || [])
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

    setCachedYouTubeSearch(query, limit, items);
    res.status(200).json({ items, configured: true });
  } catch {
    console.error('[VERCEL API] Official YouTube search request failed');
    res.status(502).json({
      items: [],
      configured: true,
      error: 'YouTube Data API request failed',
    });
  }
}
