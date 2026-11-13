import { Track, RecentlyPlayedItem, FavoriteItem } from '../types';
import { CURATED_DISCOVERY_TRACKS } from './discoveryService';

export interface AuraDiscoveryMix {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  reason: string;
  coverUrl?: string;
  coverColor: string;
  trackCount: number;
  tracks: Track[];
  isStarterMix: boolean;
  badgeText: string;
}

export interface UserListeningData {
  tracks: Track[];
  recentlyPlayed: RecentlyPlayedItem[];
  favoriteItems: FavoriteItem[];
  history: Track[];
}

/**
 * Deterministic pseudo-random shuffle with seed to avoid generating
 * the exact same queue every single time while remaining stable within a session.
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let m = result.length;
  let t: T;
  let i: number;
  let s = seed;

  while (m) {
    s = (s * 9301 + 49297) % 233280;
    i = Math.floor((s / 233280) * m--);
    t = result[m];
    result[m] = result[i];
    result[i] = t;
  }

  return result;
}

/**
 * Deduplicates tracks by ID
 */
function deduplicateTracks(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  const result: Track[] = [];
  for (const t of tracks) {
    if (t && t.id && !seen.has(t.id)) {
      seen.add(t.id);
      result.push(t);
    }
  }
  return result;
}

/**
 * Computes AURA-native discovery collections using real, private user listening data.
 * Adheres to strict privacy (local IndexedDB, no telemetry, no fabricated recommendations).
 */
export const nativeDiscoveryService = {
  /**
   * Builds the Daily Flow mix.
   * Blends recent plays, favorites, local library tracks, and curated streams.
   */
  getDailyFlow(data: UserListeningData): AuraDiscoveryMix {
    const { tracks, recentlyPlayed, favoriteItems } = data;
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );

    const recentTracks = recentlyPlayed.map((rp) => rp.track).filter(Boolean);
    const favTracks = favoriteItems.map((f) => f.track).filter(Boolean);
    const vaultTracks = tracks || [];

    const hasUserActivity = recentTracks.length > 0 || favTracks.length > 0 || vaultTracks.length > 0;

    // Collect candidates
    const primaryPool = deduplicateTracks([...favTracks, ...recentTracks, ...vaultTracks]);
    let assembledTracks: Track[] = [];

    if (primaryPool.length >= 4) {
      // User has enough personal tracks: blend with a few curated discovery tracks
      const shuffledPrimary = seededShuffle(primaryPool, dayOfYear + primaryPool.length);
      const discoverySample = seededShuffle(CURATED_DISCOVERY_TRACKS, dayOfYear).slice(0, 3);
      assembledTracks = deduplicateTracks([...shuffledPrimary, ...discoverySample]).slice(0, 16);
    } else {
      // Starter state: blend whatever user has with curated sanctuary discovery tracks
      const starterDiscovery = seededShuffle(CURATED_DISCOVERY_TRACKS, dayOfYear);
      assembledTracks = deduplicateTracks([...primaryPool, ...starterDiscovery]).slice(0, 12);
    }

    const firstArtwork = assembledTracks.find((t) => t.coverUrl)?.coverUrl;
    const favCount = favTracks.length;
    const playCount = recentTracks.length;

    const reason = hasUserActivity
      ? `Assembled from ${favCount > 0 ? `${favCount} starred track${favCount > 1 ? 's' : ''}` : ''}${
          favCount > 0 && playCount > 0 ? ' and ' : ''
        }${playCount > 0 ? `${playCount} recent play${playCount > 1 ? 's' : ''}` : ''}`
      : 'Starter Sanctuary Flow · Dynamically adapts as you star tracks and play music.';

    return {
      id: 'daily-flow',
      title: 'Daily Flow',
      subtitle: 'Your personal sanctuary stream for today',
      description: 'A continuously evolving mix drawn from your favorites, vault, and recent listening.',
      reason,
      coverUrl: firstArtwork,
      coverColor: 'from-indigo-600/40 via-purple-950/40 to-[#07090e]',
      trackCount: assembledTracks.length,
      tracks: assembledTracks,
      isStarterMix: !hasUserActivity,
      badgeText: 'DAILY FLOW',
    };
  },

  /**
   * Builds "Your Rotation" from playback frequency.
   */
  getYourRotation(data: UserListeningData): AuraDiscoveryMix | null {
    const { recentlyPlayed, history, tracks } = data;
    const occurrences = new Map<string, { track: Track; count: number }>();

    const recordTrack = (t: Track) => {
      if (!t || !t.id) return;
      const current = occurrences.get(t.id);
      if (current) {
        current.count += 1;
      } else {
        occurrences.set(t.id, { track: t, count: 1 });
      }
    };

    recentlyPlayed.forEach((rp) => rp.track && recordTrack(rp.track));
    history.forEach((t) => t && recordTrack(t));

    const sorted = Array.from(occurrences.values())
      .sort((a, b) => b.count - a.count)
      .map((entry) => entry.track);

    if (sorted.length >= 2) {
      const topRotation = sorted.slice(0, 12);
      const firstArtwork = topRotation.find((t) => t.coverUrl)?.coverUrl;

      return {
        id: 'your-rotation',
        title: 'Your Rotation',
        subtitle: 'The music you return to most often',
        description: 'Frequent rotations calculated directly from your local playback log.',
        reason: `Based on your highest-frequency listening sessions across ${topRotation.length} tracks.`,
        coverUrl: firstArtwork,
        coverColor: 'from-sky-600/40 via-cyan-950/40 to-[#07090e]',
        trackCount: topRotation.length,
        tracks: topRotation,
        isStarterMix: false,
        badgeText: 'HEAVY ROTATION',
      };
    }

    // If user has local tracks but not enough replay count, surface vault favorites as starter
    if (tracks && tracks.length >= 2) {
      const sample = tracks.slice(0, 8);
      const firstArtwork = sample.find((t) => t.coverUrl)?.coverUrl;
      return {
        id: 'your-rotation',
        title: 'Your Rotation',
        subtitle: 'Library spotlight ready for repeat listening',
        description: 'As you listen to tracks repeatedly, your top heavy-rotation items will rank here.',
        reason: 'Initial rotation spotlight from your library vault.',
        coverUrl: firstArtwork,
        coverColor: 'from-sky-600/40 via-cyan-950/40 to-[#07090e]',
        trackCount: sample.length,
        tracks: sample,
        isStarterMix: true,
        badgeText: 'LIBRARY SPOTLIGHT',
      };
    }

    return null;
  },

  /**
   * Builds "Vault Rewind" from user tracks not played recently.
   */
  getVaultRewind(data: UserListeningData): AuraDiscoveryMix | null {
    const { tracks, recentlyPlayed } = data;
    if (!tracks || tracks.length === 0) return null;

    const recentIds = new Set(recentlyPlayed.map((rp) => rp.track?.id).filter(Boolean));
    const unplayedOrOld = tracks.filter((t) => !recentIds.has(t.id));

    const rewindTracks = (unplayedOrOld.length > 0 ? unplayedOrOld : tracks).slice(0, 12);
    const firstArtwork = rewindTracks.find((t) => t.coverUrl)?.coverUrl;

    return {
      id: 'vault-rewind',
      title: 'Vault Rewind',
      subtitle: 'Rediscover neglected tracks from your personal vault',
      description: 'Surfaces audio files from your offline storage that have not been played recently.',
      reason:
        unplayedOrOld.length > 0
          ? `${unplayedOrOld.length} tracks in your vault haven't been heard recently.`
          : 'Archive selections from your personal offline audio vault.',
      coverUrl: firstArtwork,
      coverColor: 'from-emerald-600/40 via-teal-950/40 to-[#07090e]',
      trackCount: rewindTracks.length,
      tracks: rewindTracks,
      isStarterMix: false,
      badgeText: 'VAULT REWIND',
    };
  },

  /**
   * Builds "Deep Focus" only from tracks with sufficiently reliable acoustic,
   * ambient, piano, chill or lo-fi metadata.
   */
  getDeepFocus(data: UserListeningData): AuraDiscoveryMix | null {
    const { tracks, favoriteItems, recentlyPlayed } = data;
    const focusRegex = /(focus|ambient|chill|lofi|lo-fi|drone|piano|study|meditation|solitude|rain|woodland|acoustic|soft|calm|zen)/i;

    const allCandidates = deduplicateTracks([
      ...(tracks || []),
      ...favoriteItems.map((f) => f.track),
      ...recentlyPlayed.map((rp) => rp.track),
      ...CURATED_DISCOVERY_TRACKS,
    ]);

    const matching = allCandidates.filter((t) => {
      if (!t) return false;
      const haystack = `${t.title} ${t.artist} ${t.genre || ''} ${t.album || ''}`;
      return focusRegex.test(haystack);
    });

    if (matching.length < 2) return null;

    const sample = matching.slice(0, 12);
    const firstArtwork = sample.find((t) => t.coverUrl)?.coverUrl;

    return {
      id: 'deep-focus',
      title: 'Deep Focus Flow',
      subtitle: 'Minimal ambient textures & quiet instrumental spaces',
      description: 'Zero-distraction acoustic and ambient soundscapes tailored for sustained concentration.',
      reason: `Built from ${matching.length} tracks with verified ambient, piano, or focus descriptors.`,
      coverUrl: firstArtwork,
      coverColor: 'from-sky-700/40 via-indigo-950/50 to-[#07090e]',
      trackCount: sample.length,
      tracks: sample,
      isStarterMix: false,
      badgeText: 'FOCUS FLOW',
    };
  },

  /**
   * Builds "Energy Boost" only from tracks with verified up-tempo,
   * electronic, dance, or rock metadata.
   */
  getEnergyBoost(data: UserListeningData): AuraDiscoveryMix | null {
    const { tracks, favoriteItems, recentlyPlayed } = data;
    const energyRegex = /(energy|dance|electronic|house|techno|upbeat|fast|rock|bass|kinetic|synthwave|cyber|groove|club)/i;

    const allCandidates = deduplicateTracks([
      ...(tracks || []),
      ...favoriteItems.map((f) => f.track),
      ...recentlyPlayed.map((rp) => rp.track),
      ...CURATED_DISCOVERY_TRACKS,
    ]);

    const matching = allCandidates.filter((t) => {
      if (!t) return false;
      const haystack = `${t.title} ${t.artist} ${t.genre || ''} ${t.album || ''}`;
      return energyRegex.test(haystack);
    });

    if (matching.length < 2) return null;

    const sample = matching.slice(0, 12);
    const firstArtwork = sample.find((t) => t.coverUrl)?.coverUrl;

    return {
      id: 'energy-boost',
      title: 'Energy Boost',
      subtitle: 'Driving basslines, synthesizers, and kinetic BPMs',
      description: 'High-tempo rhythmic music selected to stimulate alertness and momentum.',
      reason: `Built from ${matching.length} tracks with verified electronic, synth, or kinetic rhythm tags.`,
      coverUrl: firstArtwork,
      coverColor: 'from-rose-600/40 via-amber-950/50 to-[#07090e]',
      trackCount: sample.length,
      tracks: sample,
      isStarterMix: false,
      badgeText: 'ENERGY FLOW',
    };
  },

  /**
   * Aggregate all available native mixes
   */
  getAllMixes(data: UserListeningData): AuraDiscoveryMix[] {
    const mixes: AuraDiscoveryMix[] = [];

    // 1. Daily Flow is always available
    mixes.push(this.getDailyFlow(data));

    // 2. Your Rotation
    const rotation = this.getYourRotation(data);
    if (rotation) mixes.push(rotation);

    // 3. Vault Rewind
    const rewind = this.getVaultRewind(data);
    if (rewind) mixes.push(rewind);

    // 4. Deep Focus
    const focus = this.getDeepFocus(data);
    if (focus) mixes.push(focus);

    // 5. Energy Boost
    const energy = this.getEnergyBoost(data);
    if (energy) mixes.push(energy);

    return mixes;
  },
};
