import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const clean = rawUrl.trim();

  // Handle dashboard project URL: https://supabase.com/dashboard/project/<PROJECT_REF>
  const dashboardMatch = clean.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Handle raw 20-character project reference
  if (/^[a-zA-Z0-9_-]{18,24}$/.test(clean)) {
    return `https://${clean}.supabase.co`;
  }

  // Handle projectref.supabase.co without protocol
  if (/^[a-zA-Z0-9_-]+\.supabase\.co/i.test(clean)) {
    return `https://${clean.replace(/^\/+/, '')}`.replace(/\/+$/, '');
  }

  return clean.replace(/\/+$/, '');
}

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (rawUrl && rawAnonKey && typeof rawUrl === 'string' && typeof rawAnonKey === 'string' && rawUrl.trim().length > 0 && rawAnonKey.trim().length > 0) {
    const normalizedUrl = normalizeSupabaseUrl(rawUrl);
    return {
      url: normalizedUrl,
      anonKey: rawAnonKey.trim(),
    };
  }

  return null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  if (!cachedClient) {
    try {
      cachedClient = createClient(config.url, config.anonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return cachedClient;
}
