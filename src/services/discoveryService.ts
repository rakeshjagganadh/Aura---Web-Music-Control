import { Track } from '../types';
import { WEB_STREAM_CAPABILITIES, YOUTUBE_EMBED_CAPABILITIES } from './sourceService';

export interface DiscoveryCollection {
  id: string;
  name: string;
  description: string;
  coverGradient: string;
  tags: string[];
  tracks: Track[];
}

export interface UniversalSearchResult {
  songs: Track[];
  artists: { name: string; trackCount: number; sampleCover?: string }[];
  albums: { name: string; artist: string; trackCount: number; coverGradient?: string; coverUrl?: string }[];
  playlists: { id: string; title: string; trackCount: number; coverGradient: string }[];
}

// Curated royalty-free & high-quality streams for instant 1-click playback
export const CURATED_DISCOVERY_TRACKS: Track[] = [
  {
    id: 'disc-ambient-space',
    title: 'Cosmic Drift & 432Hz Soundscape',
    artist: 'Aura Sound Lab',
    album: 'Deep Space Reverie',
    duration: 240,
    fileFormat: 'MP3 / OPEN STREAM',
    fileSize: 4200000,
    dateAdded: Date.now() - 1000000,
    coverColor: 'from-indigo-600 via-purple-700 to-slate-900',
    genre: 'Ambient Space',
    year: 2025,
    sampleRate: 44100,
    channels: 2,
    bitrate: 128,
    source: 'curated_stream',
    sourceName: 'Aura Open Audio',
    isAvailable: true,
    audioUrl: 'https://cdn.freesound.org/previews/516/516834_6699268-lq.mp3',
    playbackCapability: WEB_STREAM_CAPABILITIES,
    waveformPeaks: [0.2, 0.4, 0.6, 0.7, 0.8, 0.6, 0.5, 0.4, 0.3, 0.5, 0.7, 0.85, 0.7, 0.6, 0.5, 0.3, 0.2],
  },
  {
    id: 'disc-synthwave-odyssey',
    title: 'Neon Horizon & Analog Arp',
    artist: 'Cyberwave Collective',
    album: 'Outrun 1984',
    duration: 215,
    fileFormat: 'MP3 / OPEN STREAM',
    fileSize: 3400000,
    dateAdded: Date.now() - 800000,
    coverColor: 'from-fuchsia-600 via-pink-600 to-indigo-900',
    genre: 'Synthwave / Retrowave',
    year: 2025,
    sampleRate: 44100,
    channels: 2,
    bitrate: 128,
    source: 'curated_stream',
    sourceName: 'Aura Open Audio',
    isAvailable: true,
    audioUrl: 'https://cdn.freesound.org/previews/612/612450_5674468-lq.mp3',
    playbackCapability: WEB_STREAM_CAPABILITIES,
    waveformPeaks: [0.4, 0.7, 0.8, 0.9, 0.85, 0.95, 0.8, 0.7, 0.85, 0.9, 0.95, 0.8, 0.6, 0.5, 0.3],
  },
  {
    id: 'disc-lofi-rain',
    title: 'Rainy Night In Tokyo (Lo-Fi Study)',
    artist: 'Komorebi Lounge',
    album: 'Midnight Coffee Beats',
    duration: 185,
    fileFormat: 'MP3 / OPEN STREAM',
    fileSize: 2900000,
    dateAdded: Date.now() - 600000,
    coverColor: 'from-amber-700 via-stone-800 to-slate-900',
    genre: 'Lo-Fi Chill',
    year: 2025,
    sampleRate: 44100,
    channels: 2,
    bitrate: 128,
    source: 'curated_stream',
    sourceName: 'Aura Open Audio',
    isAvailable: true,
    audioUrl: 'https://cdn.freesound.org/previews/415/415804_5121236-lq.mp3',
    playbackCapability: WEB_STREAM_CAPABILITIES,
    waveformPeaks: [0.3, 0.5, 0.6, 0.65, 0.55, 0.6, 0.7, 0.6, 0.5, 0.55, 0.6, 0.5, 0.4, 0.3],
  },
  {
    id: 'disc-classical-piano',
    title: 'Gymnopédie No. 1 (Acoustic Grand)',
    artist: 'Erik Satie (Performed by Aura Soloists)',
    album: 'Minimal Piano Masterpieces',
    duration: 200,
    fileFormat: 'MP3 / OPEN STREAM',
    fileSize: 3100000,
    dateAdded: Date.now() - 400000,
    coverColor: 'from-cyan-900 via-blue-950 to-slate-950',
    genre: 'Neo-Classical',
    year: 2024,
    sampleRate: 44100,
    channels: 2,
    bitrate: 128,
    source: 'curated_stream',
    sourceName: 'Aura Open Audio',
    isAvailable: true,
    audioUrl: 'https://cdn.freesound.org/previews/477/477209_9845727-lq.mp3',
    playbackCapability: WEB_STREAM_CAPABILITIES,
    waveformPeaks: [0.2, 0.3, 0.5, 0.4, 0.6, 0.5, 0.4, 0.3, 0.5, 0.6, 0.4, 0.3, 0.2, 0.1],
  },
  {
    id: 'disc-binaural-8d',
    title: '8D Binaural Forest & Spatial Resonance',
    artist: 'Spatial Audio Lab',
    album: 'Acoustic Environments Vol. 1',
    duration: 230,
    fileFormat: 'MP3 / OPEN STREAM',
    fileSize: 3600000,
    dateAdded: Date.now() - 200000,
    coverColor: 'from-emerald-700 via-teal-900 to-zinc-950',
    genre: 'Binaural 3D',
    year: 2025,
    sampleRate: 44100,
    channels: 2,
    bitrate: 128,
    source: 'curated_stream',
    sourceName: 'Aura Open Audio',
    isAvailable: true,
    audioUrl: 'https://cdn.freesound.org/previews/689/689369_11861866-lq.mp3',
    playbackCapability: WEB_STREAM_CAPABILITIES,
    waveformPeaks: [0.3, 0.4, 0.6, 0.7, 0.8, 0.7, 0.6, 0.5, 0.7, 0.8, 0.9, 0.7, 0.5, 0.3],
  },
  {
    id: 'disc-future-bass',
    title: 'Hyperdrive Resonance (Sub Bass Test)',
    artist: 'Vortex Dynamics',
    album: 'Aura Club Sessions',
    duration: 195,
    fileFormat: 'MP3 / STREAM',
    fileSize: 15500000,
    dateAdded: Date.now() - 100000,
    coverColor: 'from-violet-600 via-indigo-800 to-black',
    genre: 'Electronic / Bass',
    year: 2025,
    sampleRate: 48000,
    channels: 2,
    bitrate: 320,
    source: 'curated_stream',
    sourceName: 'Aura Open Audio',
    isAvailable: true,
    audioUrl: 'https://cdn.freesound.org/previews/612/612450_5674468-lq.mp3',
    playbackCapability: WEB_STREAM_CAPABILITIES,
    waveformPeaks: [0.5, 0.8, 0.9, 0.95, 0.7, 0.9, 0.95, 0.85, 0.9, 0.95, 0.8, 0.6, 0.4],
  },
];

export const CURATED_COLLECTIONS: DiscoveryCollection[] = [
  {
    id: 'col-focus',
    name: 'Deep Focus & Ambient Space',
    description: 'Immersive textures with minimal distraction and wide binaural depth.',
    coverGradient: 'from-indigo-600 via-purple-700 to-slate-900',
    tags: ['Ambient', 'Focus', '432Hz', 'Spatial'],
    tracks: [CURATED_DISCOVERY_TRACKS[0], CURATED_DISCOVERY_TRACKS[4]],
  },
  {
    id: 'col-synth',
    name: 'Cyberwave & Retro Analog',
    description: 'Punchy analog synthesizers, dynamic basslines, and tape warmth.',
    coverGradient: 'from-fuchsia-600 via-pink-600 to-indigo-900',
    tags: ['Synthwave', 'Analog', 'Retro', 'Punchy'],
    tracks: [CURATED_DISCOVERY_TRACKS[1], CURATED_DISCOVERY_TRACKS[5]],
  },
  {
    id: 'col-study',
    name: 'Lo-Fi Chill & Night Rain',
    description: 'Warm vinyl crackle, gentle Rhodes keys, and relaxing tempos.',
    coverGradient: 'from-amber-700 via-stone-800 to-slate-900',
    tags: ['Lo-Fi', 'Chill', 'Rain', 'Warm'],
    tracks: [CURATED_DISCOVERY_TRACKS[2], CURATED_DISCOVERY_TRACKS[3]],
  },
];

// Helper to create a YouTube track object for the universal player
export function createYouTubeTrack(videoId: string, title?: string, artist?: string): Track {
  return {
    id: `yt-${videoId}`,
    title: title || `YouTube: ${videoId}`,
    artist: artist || 'YouTube Music Embed',
    album: 'YouTube Stream',
    duration: 0,
    fileFormat: 'YOUTUBE',
    fileSize: 0,
    dateAdded: Date.now(),
    coverColor: 'from-red-700 via-zinc-900 to-black',
    source: 'youtube',
    sourceId: videoId,
    sourceName: 'YouTube Embed',
    sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
    isAvailable: true,
    playbackCapability: YOUTUBE_EMBED_CAPABILITIES,
  };
}

// Helper to create a Custom Web Stream track
export function createWebStreamTrack(url: string, title: string, artist?: string): Track {
  return {
    id: `stream-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title: title || 'Custom Web Audio Stream',
    artist: artist || 'Internet Audio Source',
    album: 'Web Radio & Stream',
    duration: 0,
    fileFormat: 'STREAM',
    fileSize: 0,
    dateAdded: Date.now(),
    coverColor: 'from-cyan-700 via-indigo-900 to-zinc-950',
    source: 'web_stream',
    sourceName: 'Web Stream',
    externalStreamUrl: url,
    audioUrl: url,
    isAvailable: true,
    playbackCapability: WEB_STREAM_CAPABILITIES,
  };
}
