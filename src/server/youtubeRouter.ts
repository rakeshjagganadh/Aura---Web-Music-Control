import { Router, Request, Response } from 'express';
import type { Track } from '../types';

export const youtubeRouter = Router();

function getServerYouTubeApiKey(): string {
  return (
    process.env.YOUTUBE_DATA_API_KEY ||
    process.env.YOUTUBE_API_KEY ||
    ''
  ).trim();
}

function isOriginAllowed(origin: string | undefined, host: string | undefined): boolean {
  if (!origin) return true;
  const configured = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured.includes(origin);
  }

  if (!host) return false;
  try {
    const parsed = new URL(origin);
    return parsed.host === host;
  } catch {
    return false;
  }
}

youtubeRouter.options('*', (req: Request, res: Response) => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
  if (origin && isOriginAllowed(origin, host)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).end();
});

/**
 * GET /api/yt/search?q=<query>&limit=12
 * Official YouTube Data API v3 server-side search proxy using server-only credentials.
 * Does NOT perform HTML scraping, cookie injection, or unofficial audio extraction.
 */
youtubeRouter.get('/search', async (req: Request, res: Response) => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
  if (origin && isOriginAllowed(origin, host)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const query = rawQuery.slice(0, 200);
  const limit = Math.min(25, Math.max(1, parseInt(String(req.query.limit || '12'), 10) || 12));

  if (!query) {
    res.json({ items: [], configured: Boolean(getServerYouTubeApiKey()) });
    return;
  }

  const apiKey = getServerYouTubeApiKey();
  if (!apiKey) {
    res.json({
      items: [],
      configured: false,
      warning: 'YouTube Data API search is not configured on this server. Paste a YouTube URL to play via official embed.',
    });
    return;
  }

  try {
    const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=${limit}&q=${encodeURIComponent(
      query
    )}&key=${encodeURIComponent(apiKey)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const ytRes = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!ytRes.ok) {
      res.status(ytRes.status === 403 ? 502 : ytRes.status).json({
        items: [],
        configured: true,
        error: `YouTube Data API returned status ${ytRes.status}`,
      });
      return;
    }

    const data = (await ytRes.json()) as { items?: Array<{ id?: { videoId?: string }; snippet?: any }> };
    const items = (data.items || [])
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
          source: 'youtube' as const satisfies Track['source'],
        };
      });

    res.json({ items, configured: true });
  } catch (err: any) {
    console.error('[YOUTUBE ROUTER] Official API search error:', err?.message || err);
    res.status(502).json({
      items: [],
      configured: true,
      error: 'Unable to reach official YouTube Data API.',
    });
  }
});
