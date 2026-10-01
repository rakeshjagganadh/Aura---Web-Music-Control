import { Router, Request, Response } from 'express';
import { Readable } from 'stream';
import { Innertube, UniversalCache, ClientType } from 'youtubei.js';

export const youtubeRouter = Router();

// Strict YouTube Video ID validator: exactly 11 characters (alphanumeric, underscore, hyphen)
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

// Singleton Innertube instances
let cachedWebInstance: Innertube | null = null;
let cachedIosInstance: Innertube | null = null;
let initPromise: Promise<void> | null = null;

async function getInnertubeInstances(): Promise<{ web: Innertube; ios: Innertube }> {
  if (cachedWebInstance && cachedIosInstance) {
    return { web: cachedWebInstance, ios: cachedIosInstance };
  }

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const [web, ios] = await Promise.all([
          Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true,
          }),
          Innertube.create({
            client_type: ClientType.IOS,
            cache: new UniversalCache(false),
            generate_session_locally: true,
          }),
        ]);
        cachedWebInstance = web;
        cachedIosInstance = ios;
      } catch (err) {
        console.error('[YOUTUBE ROUTER] Failed to initialize Innertube session:', err);
        initPromise = null;
        throw err;
      }
    })();
  }

  await initPromise;
  return { web: cachedWebInstance!, ios: cachedIosInstance! };
}

// Global CORS preflight for all /api/yt routes
youtubeRouter.options('*', (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges, Content-Type');
  res.status(204).end();
});

/**
 * GET /api/yt/search?q=<query>&limit=15
 * Normalized search endpoint without requiring Google YouTube Data API v3 key
 */
youtubeRouter.get('/search', async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const limit = Math.min(25, Math.max(1, parseInt(String(req.query.limit || '15'), 10) || 15));

  if (!query) {
    res.json({ items: [] });
    return;
  }

  try {
    const { web } = await getInnertubeInstances();
    const searchResult = await web.search(query);
    const rawVideos = searchResult.videos || [];

    const items = rawVideos.slice(0, limit).map((v: any) => {
      let durationSec = 0;
      if (typeof v.duration?.seconds === 'number') {
        durationSec = v.duration.seconds;
      } else if (typeof v.duration?.text === 'string') {
        const parts = v.duration.text.split(':').map((p: string) => parseInt(p, 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          durationSec = parts[0] * 60 + parts[1];
        } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }

      const title = typeof v.title === 'string' ? v.title : (v.title?.text || 'YouTube Audio');
      const author = typeof v.author === 'string' ? v.author : (v.author?.name || 'YouTube Creator');
      const thumbnail = v.thumbnails?.[0]?.url || (v.id ? `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` : '');

      return {
        id: v.id,
        title,
        artist: author,
        duration: durationSec,
        thumbnail,
        source: 'youtube' as const,
      };
    });

    res.json({ items });
  } catch (err: any) {
    console.error('[YOUTUBE ROUTER] Search error:', err);
    res.status(500).json({
      error: 'Failed to search YouTube stream catalog',
      message: err?.message || 'Upstream search error',
      items: [],
    });
  }
});

/**
 * GET /api/yt/audio?id=<YOUTUBE_VIDEO_ID>
 * Streams resolved audio with full HTTP Range request (206) support
 */
youtubeRouter.all('/audio', async (req: Request, res: Response) => {
  // Enforce CORS for browser HTMLAudioElement & Web Audio fetch
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'Method not allowed. Use GET or HEAD.' });
    return;
  }

  const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';

  // 1. Strict Security Validation: prevents SSRF, directory traversal, parameter injection
  if (!id || !YOUTUBE_ID_REGEX.test(id)) {
    res.status(400).json({
      error: 'Invalid YouTube video ID format. Must be an 11-character alphanumeric identifier.',
    });
    return;
  }

  const abortController = new AbortController();
  req.on('close', () => {
    abortController.abort();
  });

  try {
    const { ios, web } = await getInnertubeInstances();

    // 2. Resolve audio stream formats
    // Try iOS client first (bypasses web signature deciphering and provides direct audio formats)
    let info = await ios.getBasicInfo(id).catch(() => null);

    // Fallback to web client if iOS client returned null
    if (!info || !info.streaming_data) {
      info = await web.getBasicInfo(id).catch(() => null);
    }

    if (!info) {
      res.status(404).json({ error: 'Unable to retrieve video information.' });
      return;
    }

    // 3. Playability Status Validation
    if (info.playability_status?.status !== 'OK') {
      const reason = info.playability_status?.reason || 'Video unavailable for streaming';
      const status = info.playability_status?.status || 'UNAVAILABLE';
      res.status(403).json({
        error: `YouTube stream unavailable: ${reason}`,
        status,
        code: status === 'LOGIN_REQUIRED' ? 'BOTGUARD_RESTRICTION' : 'STREAM_RESTRICTED',
      });
      return;
    }

    // 4. Select best audio-only format with direct URL
    const adaptiveFormats = info.streaming_data?.adaptive_formats || [];
    const audioFormats = adaptiveFormats.filter((f: any) => f.has_audio && !f.has_video && f.url);

    if (audioFormats.length === 0) {
      res.status(404).json({
        error: 'No direct audio-only stream available for this video.',
      });
      return;
    }

    // Sort by bitrate descending to get best quality audio
    audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
    const selectedFormat = audioFormats[0];
    const streamUrl = selectedFormat.url;
    const rawMime = selectedFormat.mime_type || 'audio/mp4';
    const contentType = rawMime.split(';')[0].trim() || 'audio/mp4';

    // 5. Handle HTTP Range forwarding
    const clientRange = req.headers.range;
    const upstreamHeaders: Record<string, string> = {
      'User-Agent':
        'com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1_0 like Mac OS X; en_US)',
    };
    if (clientRange) {
      upstreamHeaders['Range'] = clientRange;
    }

    const upstreamResponse = await fetch(streamUrl, {
      method: req.method,
      headers: upstreamHeaders,
      signal: abortController.signal,
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      res.status(upstreamResponse.status).json({
        error: `Upstream media server returned error ${upstreamResponse.status}`,
      });
      return;
    }

    // 6. Set response headers
    res.status(upstreamResponse.status);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=14400'); // Cache stream segments for 4 hours

    const contentLength = upstreamResponse.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const contentRange = upstreamResponse.headers.get('content-range');
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
    }

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    // 7. Pipe audio stream to client without saving to disk or buffering whole song in memory
    if (upstreamResponse.body) {
      const nodeStream = Readable.fromWeb(upstreamResponse.body as any);
      nodeStream.on('error', (err) => {
        if (!res.headersSent) {
          res.status(500).json({ error: 'Stream transfer interrupted' });
        }
        res.end();
      });
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return;
    }
    console.error('[YOUTUBE ROUTER] Audio stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to resolve audio stream',
        message: err?.message || 'Internal streaming error',
      });
    }
  }
});
