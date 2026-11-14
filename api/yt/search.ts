import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  query?: Record<string, string | string[]>;
  method?: string;
  url?: string;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (jsonBody: unknown) => VercelResponse;
}

function getServerYouTubeApiKey(): string {
  return (
    process.env.YOUTUBE_DATA_API_KEY ||
    process.env.YOUTUBE_API_KEY ||
    ''
  ).trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
  if (origin && host) {
    try {
      if (new URL(origin).host === host) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
      }
    } catch {
      // ignore invalid origin
    }
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  let query = '';
  let limit = 12;

  if (req.query) {
    query = typeof req.query.q === 'string' ? req.query.q.trim() : Array.isArray(req.query.q) ? (req.query.q[0] || '').trim() : '';
    const l = req.query.limit;
    if (l) {
      limit = Math.min(25, Math.max(1, parseInt(String(Array.isArray(l) ? l[0] : l), 10) || 12));
    }
  } else if (req.url) {
    try {
      const u = new URL(req.url, 'http://localhost');
      query = (u.searchParams.get('q') || '').trim();
      const l = u.searchParams.get('limit');
      if (l) {
        limit = Math.min(25, Math.max(1, parseInt(l, 10) || 12));
      }
    } catch {
      // ignore
    }
  }

  query = query.slice(0, 200);
  const apiKey = getServerYouTubeApiKey();

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

  try {
    const endpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=${limit}&q=${encodeURIComponent(
      query
    )}&key=${encodeURIComponent(apiKey)}`;

    const ytRes = await fetch(endpoint);
    if (!ytRes.ok) {
      res.status(502).json({
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

    res.status(200).json({ items, configured: true });
  } catch (err: any) {
    console.error('[VERCEL API] Official YouTube search error:', err?.message || err);
    res.status(502).json({
      items: [],
      configured: true,
      error: 'YouTube Data API request failed',
    });
  }
}
