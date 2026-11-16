import { Router, Request, Response } from 'express';
import {
  resolveYouTubeServerKey,
  validateAuraSearchAccess,
  getValidatedGoogleReferer,
  getCachedYouTubeSearch,
  setCachedYouTubeSearch,
  getClientIp,
  isRateLimited,
  type CachedYouTubeTrackItem,
} from './ytKeyVault';

export const youtubeRouter = Router();

youtubeRouter.options('*', (req: Request, res: Response) => {
  const access = validateAuraSearchAccess(req.headers, 'OPTIONS');
  if (!access.allowed) {
    res.status(403).end();
    return;
  }
  if (access.corsOrigin) {
    res.setHeader('Access-Control-Allow-Origin', access.corsOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Aura-Client');
  res.status(204).end();
});

/**
 * GET /api/yt/search?q=<query>&limit=15
 * Official YouTube Data API v3 server-side search proxy restricted strictly to AURA.
 * Does NOT perform HTML scraping, cookie injection, or unofficial audio extraction.
 */
youtubeRouter.get('/search', async (req: Request, res: Response) => {
  const access = validateAuraSearchAccess(req.headers, 'GET');
  if (!access.allowed) {
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
  res.setHeader('Cache-Control', 'private, max-age=120');

  const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const query = rawQuery.slice(0, 200);
  const limit = Math.min(25, Math.max(1, parseInt(String(req.query.limit || '15'), 10) || 15));

  const apiKey = resolveYouTubeServerKey();

  if (!query) {
    res.json({ items: [], configured: Boolean(apiKey) });
    return;
  }

  if (!apiKey) {
    res.json({
      items: [],
      configured: false,
      warning: 'YouTube Data API search is not configured on this server. Paste a YouTube URL to play via official embed.',
    });
    return;
  }

  // Return cached results before hitting quota or rate limit
  const cachedItems = getCachedYouTubeSearch(query, limit);
  if (cachedItems) {
    res.json({ items: cachedItems, configured: true });
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

      res.status(ytRes.status === 403 ? 502 : ytRes.status).json({
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
        const thumbnail =
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
          id: videoId,
          title: snippet.title || 'YouTube Video',
          artist: snippet.channelTitle || 'YouTube Creator',
          duration: 0,
          thumbnail,
          source: 'youtube' as const,
        };
      });

    setCachedYouTubeSearch(query, limit, items);
    res.json({ items, configured: true });
  } catch {
    console.error('[YOUTUBE ROUTER] Official API search request failed');
    res.status(502).json({
      items: [],
      configured: true,
      error: 'Unable to reach official YouTube Data API.',
    });
  }
});
