import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  body?: any;
  method?: string;
  url?: string;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  send: (body: any) => VercelResponse;
}

/**
 * Extracts ytInitialData from YouTube HTML using balanced-bracket JSON scanning
 */
function extractYtInitialData(html: string): any {
  const marker = 'ytInitialData = ';
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) return null;
  const jsonStart = html.indexOf('{', startIdx);
  if (jsonStart === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  let jsonEnd = -1;

  for (let i = jsonStart; i < html.length; i++) {
    const char = html[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
  }

  if (jsonEnd !== -1) {
    try {
      return JSON.parse(html.substring(jsonStart, jsonEnd));
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Direct web scraper for YouTube results with SOCS cookie header
 * Works in cloud datacenters and serverless runtimes (Vercel, AWS, Cloud Run)
 */
async function searchYouTubeViaWeb(query: string, limit: number) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Cookie: 'SOCS=CAESEwgDEgk2MTQ5MTAyMjQaAmVuIAEaBgiA_LWaBg; CONSENT=PENDING+999;',
    },
  });

  if (!res.ok) {
    throw new Error(`YouTube returned status ${res.status}`);
  }

  const html = await res.text();
  const data = extractYtInitialData(html);
  if (!data) {
    throw new Error('Could not parse initial data from YouTube');
  }

  const sections =
    data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
  const items: Array<{
    id: string;
    title: string;
    artist: string;
    duration: number;
    thumbnail: string;
    source: 'youtube';
  }> = [];

  for (const section of sections) {
    const renderers = section.itemSectionRenderer?.contents || [];
    for (const item of renderers) {
      const v = item.videoRenderer;
      if (!v || !v.videoId) continue;
      const id = v.videoId;
      const title =
        v.title?.runs?.map((r: any) => r.text).join('') || v.title?.simpleText || 'YouTube Audio';
      const artist =
        v.ownerText?.runs?.map((r: any) => r.text).join('') ||
        v.shortBylineText?.runs?.map((r: any) => r.text).join('') ||
        'YouTube Creator';
      const durationText = v.lengthText?.simpleText || '';
      let durationSec = 0;
      if (durationText) {
        const parts = durationText.split(':').map((p: string) => parseInt(p, 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          durationSec = parts[0] * 60 + parts[1];
        } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }
      const thumbnail =
        v.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      items.push({
        id,
        title,
        artist,
        duration: durationSec,
        thumbnail,
        source: 'youtube',
      });
      if (items.length >= limit) break;
    }
    if (items.length >= limit) break;
  }

  return items;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  let query = '';
  let limit = 15;

  if (req.query) {
    query = typeof req.query.q === 'string' ? req.query.q.trim() : (Array.isArray(req.query.q) ? req.query.q[0] : '');
    const l = req.query.limit;
    if (l) {
      limit = Math.min(25, Math.max(1, parseInt(String(Array.isArray(l) ? l[0] : l), 10) || 15));
    }
  } else if (req.url) {
    try {
      const u = new URL(req.url, 'http://localhost');
      query = u.searchParams.get('q')?.trim() || '';
      const l = u.searchParams.get('limit');
      if (l) {
        limit = Math.min(25, Math.max(1, parseInt(l, 10) || 15));
      }
    } catch {
      // ignore
    }
  }

  if (!query) {
    res.status(200).json({ items: [] });
    return;
  }

  try {
    const items = await searchYouTubeViaWeb(query, limit);
    res.status(200).json({ items });
  } catch (err: any) {
    console.error('[VERCEL API] Search error:', err?.message || err);
    res.status(200).json({
      items: [],
      error: err?.message || 'Search failed',
    });
  }
}
