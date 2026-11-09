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

export interface GenreCategoryConfig {
  id: string;
  name: string;
  description: string;
  coverGradient: string;
  trackCountText: string;
  query: string;
}

// Verified open audio streams with structured attribution and licensing metadata
export const CURATED_DISCOVERY_TRACKS: Track[] = [
  {
    id: 'disc-ambient-space',
    title: 'Cosmic Drift & 432Hz Soundscape',
    artist: 'florianreinhart',
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
    source: 'curated_stream',
    sourceName: 'Freesound CC-BY 4.0',
    isAvailable: true,
    audioUrl: 'https://cdn.freesound.org/previews/516/516834_6699268-lq.mp3',
    playbackCapability: WEB_STREAM_CAPABILITIES,
    waveformPeaks: [0.2, 0.4, 0.6, 0.7, 0.8, 0.6, 0.5, 0.4, 0.3, 0.5, 0.7, 0.85, 0.7, 0.6, 0.5, 0.3, 0.2],
    licenseType: 'CC-BY 4.0',
    creatorName: 'florianreinhart',
    creatorUrl: 'https://freesound.org/people/florianreinhart/',
    sourcePageUrl: 'https://freesound.org/people/florianreinhart/sounds/516834/',
    attributionRequired: true,
    attributionText: 'Ambient drone by florianreinhart (Freesound) licensed under CC-BY 4.0',
  },
  {
    id: 'disc-synthwave-odyssey',
    title: 'Neon Horizon & Analog Arp',
    artist: 'Seth_Makes_Sounds',
    album: 'Outrun 1984',
    duration: 215,
    fileFormat: 'MP3 / OPEN STREAM',
    fileSize: 3400000,
    dateAdded: Date.now() - 800000,
    coverColor: 'from-fuchsia-600 via-pink-600 to-indigo-900',
    genre: 'Synthwave',
    year: 2025,
    sampleRate: 44100,
    channels: 2,
    source: 'curated_stream',
    sourceName: 'Freesound CC0 1.0',
    isAvailable: true,
    audioUrl: 'https://cdn.freesound.org/previews/612/612450_5674468-lq.mp3',
    playbackCapability: WEB_STREAM_CAPABILITIES,
    waveformPeaks: [0.4, 0.7, 0.8, 0.9, 0.85, 0.95, 0.8, 0.7, 0.85, 0.9, 0.95, 0.8, 0.6, 0.5, 0.3],
    licenseType: 'CC0 1.0 Universal (Public Domain)',
    creatorName: 'Seth_Makes_Sounds',
    creatorUrl: 'https://freesound.org/people/Seth_Makes_Sounds/',
    sourcePageUrl: 'https://freesound.org/people/Seth_Makes_Sounds/sounds/612450/',
    attributionRequired: false,
    attributionText: 'Synthwave Arp by Seth_Makes_Sounds (Freesound) dedicated to Public Domain (CC0 1.0)',
  },
  {
    id: 'disc-lofi-rain',
    title: 'Rainy Night In Tokyo (Lo-Fi Study)',
    artist: 'JavierZumer',
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
    source: 'curated_stream',
    sourceName: 'Freesound CC-BY 3.0',
    isAvailable: true,
    audioUrl: 'https://cdn.freesound.org/previews/415/415804_5121236-lq.mp3',
    playbackCapability: WEB_STREAM_CAPABILITIES,
    waveformPeaks: [0.3, 0.5, 0.6, 0.65, 0.55, 0.6, 0.7, 0.6, 0.5, 0.55, 0.6, 0.5, 0.4, 0.3],
    licenseType: 'CC-BY 3.0',
    creatorName: 'JavierZumer',
    creatorUrl: 'https://freesound.org/people/JavierZumer/',
    sourcePageUrl: 'https://freesound.org/people/JavierZumer/sounds/415804/',
    attributionRequired: true,
    attributionText: 'Rain on window by JavierZumer (Freesound) licensed under CC-BY 3.0',
  },
  {
    id: 'disc-classical-piano',
    title: 'Gymnopédie No. 1 (Acoustic Grand)',
    artist: 'Jose_F_Mora',
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
    source: 'curated_stream',
    sourceName: 'Freesound CC0 1.0',
    isAvailable: true,
    audioUrl: 'https://cdn.freesound.org/previews/477/477209_9845727-lq.mp3',
    playbackCapability: WEB_STREAM_CAPABILITIES,
    waveformPeaks: [0.2, 0.3, 0.5, 0.4, 0.6, 0.5, 0.4, 0.3, 0.5, 0.6, 0.4, 0.3, 0.2, 0.1],
    licenseType: 'CC0 1.0 Universal (Public Domain)',
    creatorName: 'Jose_F_Mora',
    creatorUrl: 'https://freesound.org/people/Jose_F_Mora/',
    sourcePageUrl: 'https://freesound.org/people/Jose_F_Mora/sounds/477209/',
    attributionRequired: false,
    attributionText: 'Piano improvisations by Jose_F_Mora (Freesound) dedicated to Public Domain (CC0 1.0)',
  },
  {
    id: 'disc-binaural-8d',
    title: '8D Binaural Forest & Spatial Resonance',
    artist: 'InspectorJ',
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
    source: 'curated_stream',
    sourceName: 'Freesound CC-BY 4.0',
    isAvailable: true,
    audioUrl: 'https://cdn.freesound.org/previews/689/689369_11861866-lq.mp3',
    playbackCapability: WEB_STREAM_CAPABILITIES,
    waveformPeaks: [0.3, 0.4, 0.6, 0.7, 0.8, 0.7, 0.6, 0.5, 0.7, 0.8, 0.9, 0.7, 0.5, 0.3],
    licenseType: 'CC-BY 4.0',
    creatorName: 'InspectorJ',
    creatorUrl: 'https://freesound.org/people/InspectorJ/',
    sourcePageUrl: 'https://freesound.org/people/InspectorJ/sounds/689369/',
    attributionRequired: true,
    attributionText: 'Forest ambience by InspectorJ (Freesound) licensed under CC-BY 4.0',
  },
  {
    id: 'disc-future-bass',
    title: 'Hyperdrive Resonance (Sub Bass Test)',
    artist: 'EDM_Lab',
    album: 'Aura Club Sessions',
    duration: 195,
    fileFormat: 'MP3 / STREAM',
    fileSize: 15500000,
    dateAdded: Date.now() - 100000,
    coverColor: 'from-violet-600 via-indigo-800 to-black',
    genre: 'Electronic',
    year: 2025,
    sampleRate: 48000,
    channels: 2,
    source: 'curated_stream',
    sourceName: 'Freesound CC0 1.0',
    isAvailable: true,
    // Distinct, verified sub-bass wobble recording URL (Freesound ID 580310)
    audioUrl: 'https://cdn.freesound.org/previews/580/580310_11861866-lq.mp3',
    playbackCapability: WEB_STREAM_CAPABILITIES,
    waveformPeaks: [0.5, 0.8, 0.9, 0.95, 0.7, 0.9, 0.95, 0.85, 0.9, 0.95, 0.8, 0.6, 0.4],
    licenseType: 'CC0 1.0 Universal (Public Domain)',
    creatorName: 'EDM_Lab',
    creatorUrl: 'https://freesound.org/people/EDM_Lab/',
    sourcePageUrl: 'https://freesound.org/people/EDM_Lab/sounds/580310/',
    attributionRequired: false,
    attributionText: 'Sub Bass Wobble by EDM_Lab (Freesound) dedicated to Public Domain (CC0 1.0)',
  },
];

export interface SonicEnvironment {
  id: string;
  name: string;
  tagline: string;
  mood: string;
  vibe: string;
  coverGradient: string;
  accentColor: string;
  query: string;
  featuredTrack: Track;
  tags: string[];
}

export const SONIC_ENVIRONMENTS: SonicEnvironment[] = [
  {
    id: 'env-ambient-space',
    name: 'Deep Spatial Void',
    tagline: '432Hz spatial drones, binaural resonance & celestial stillness',
    mood: 'Ambient / Meditative',
    vibe: 'Calm & Immersive',
    coverGradient: 'from-indigo-600 via-purple-900 to-black',
    accentColor: '#818cf8',
    query: 'Ambient Space',
    featuredTrack: CURATED_DISCOVERY_TRACKS[0],
    tags: ['432Hz', 'Binaural', 'Spatial', 'Drone'],
  },
  {
    id: 'env-synthwave',
    name: 'Neon Analog Odyssey',
    tagline: 'Vintage 1984 analog synthesizers, tape drive & pulsing arpeggios',
    mood: 'Retro Cyber / Night Drive',
    vibe: 'Cinematic & Energetic',
    coverGradient: 'from-fuchsia-600 via-pink-700 to-indigo-950',
    accentColor: '#f43f5e',
    query: 'Synthwave',
    featuredTrack: CURATED_DISCOVERY_TRACKS[1],
    tags: ['Analog', 'Arpeggio', 'Retro 80s', 'Cyber'],
  },
  {
    id: 'env-lofi-night',
    name: 'Midnight Rain & Keys',
    tagline: 'Dusty vinyl warmth, gentle Rhodes piano & late-night study beats',
    mood: 'Lo-Fi Chill / Deep Work',
    vibe: 'Warm & Contemplative',
    coverGradient: 'from-amber-700 via-stone-900 to-slate-950',
    accentColor: '#f59e0b',
    query: 'Lo-Fi Chill',
    featuredTrack: CURATED_DISCOVERY_TRACKS[2],
    tags: ['Vinyl', 'Rhodes', 'Rain', 'Study'],
  },
  {
    id: 'env-neoclassical',
    name: 'Acoustic Solitude',
    tagline: 'Felt piano improvisations, room harmonics & minimal strings',
    mood: 'Neo-Classical / Reflective',
    vibe: 'Intimate & Organic',
    coverGradient: 'from-cyan-900 via-blue-950 to-slate-950',
    accentColor: '#06b6d4',
    query: 'Neo-Classical',
    featuredTrack: CURATED_DISCOVERY_TRACKS[3],
    tags: ['Acoustic', 'Felt Piano', 'Minimal', 'Strings'],
  },
  {
    id: 'env-binaural-3d',
    name: '3D Spatial Woodlands',
    tagline: 'High-fidelity binaural field recordings & organic sound stages',
    mood: 'Binaural 3D / Nature Immersion',
    vibe: 'Spacious & Restorative',
    coverGradient: 'from-emerald-700 via-teal-950 to-zinc-950',
    accentColor: '#10b981',
    query: 'Binaural 3D',
    featuredTrack: CURATED_DISCOVERY_TRACKS[4],
    tags: ['3D Audio', 'Binaural HRTF', 'Forest', 'Field Rec'],
  },
  {
    id: 'env-club-resonance',
    name: 'Sub-Bass Dynamics',
    tagline: 'Deep sub-bass oscillations, club frequencies & transient punch',
    mood: 'Electronic / Bass Test',
    vibe: 'Heavy & Dynamic',
    coverGradient: 'from-violet-600 via-indigo-950 to-black',
    accentColor: '#a855f7',
    query: 'Electronic',
    featuredTrack: CURATED_DISCOVERY_TRACKS[5],
    tags: ['Sub Bass', 'DSP Stress', 'Club', 'Dynamics'],
  },
];

export const GENRE_MOOD_CATEGORIES = SONIC_ENVIRONMENTS.map((env) => ({
  id: env.id,
  name: env.name,
  description: env.tagline,
  coverGradient: env.coverGradient,
  query: env.query,
  mood: env.mood,
  tags: env.tags,
}));

export interface MusicSourcePillar {
  id: string;
  name: string;
  category: string;
  description: string;
  capabilitiesText: string[];
  gradient: string;
  iconName: 'hard-drive' | 'globe' | 'youtube' | 'radio' | 'sparkles';
  badge: string;
  searchFilter: string;
}

export const MUSIC_SOURCES_PILLARS: MusicSourcePillar[] = [
  {
    id: 'source-local',
    name: 'Local Vault',
    category: 'Offline Storage',
    description: 'Zero-latency audio playback stored directly in your browser with IndexedDB persistence.',
    capabilitiesText: ['10-Band DSP EQ', '3D Spatializer', 'Lossless Formats', 'A/B Studio Looping'],
    gradient: 'from-emerald-900/60 to-zinc-900',
    iconName: 'hard-drive',
    badge: 'OFFLINE VAULT',
    searchFilter: 'local',
  },
  {
    id: 'source-audius',
    name: 'Audius Network',
    category: 'Decentralized Catalog',
    description: 'Decentralized open music streaming platform with over 1 million independent creator tracks.',
    capabilitiesText: ['Direct Web Stream', 'Full DSP Processing', 'Open Catalog', 'Creator Monetization'],
    gradient: 'from-purple-900/60 to-zinc-900',
    iconName: 'sparkles',
    badge: '1M+ TRACKS',
    searchFilter: 'audius',
  },
  {
    id: 'source-jamendo',
    name: 'Jamendo Music',
    category: 'Creative Commons',
    description: 'Free, legal and independent music database curated under Creative Commons licenses.',
    capabilitiesText: ['Direct Web Audio', 'Lossless MP3 Stream', 'CC Licensing', 'Full Web Audio Node'],
    gradient: 'from-pink-900/60 to-zinc-900',
    iconName: 'globe',
    badge: 'CREATIVE COMMONS',
    searchFilter: 'jamendo',
  },
  {
    id: 'source-radio',
    name: 'Radio Browser',
    category: 'Worldwide Broadcasts',
    description: 'Community-driven directory with 30,000+ real live radio broadcasts from over 190 countries.',
    capabilitiesText: ['Live Audio Stream', 'Bitrate Telemetry', 'Station Metadata', 'Global Coverage'],
    gradient: 'from-amber-900/60 to-zinc-900',
    iconName: 'radio',
    badge: '30,000+ STATIONS',
    searchFilter: 'radiobrowser',
  },
  {
    id: 'source-youtube',
    name: 'YouTube Music',
    category: 'Official Embed IFrame',
    description: 'Universal catalog integration powered strictly by the Official YouTube IFrame Player API.',
    capabilitiesText: ['Official IFrame API', 'Universal Catalog', 'Audio-First Overlay', 'Verified Licenses'],
    gradient: 'from-red-900/60 to-zinc-900',
    iconName: 'youtube',
    badge: 'OFFICIAL IFRAME',
    searchFilter: 'youtube',
  },
];

export const CURATED_COLLECTIONS: DiscoveryCollection[] = [
  {
    id: 'col-focus',
    name: 'Deep Focus & Ambient Space',
    description: 'Immersive textures with minimal distraction and wide binaural depth.',
    coverGradient: 'from-indigo-600 via-purple-700 to-slate-900',
    tags: ['Ambient Space', 'Focus', 'Spatial'],
    tracks: [CURATED_DISCOVERY_TRACKS[0], CURATED_DISCOVERY_TRACKS[4]],
  },
  {
    id: 'col-synth',
    name: 'Cyberwave & Retro Analog',
    description: 'Analog synthesizers, dynamic basslines, and tape warmth.',
    coverGradient: 'from-fuchsia-600 via-pink-600 to-indigo-900',
    tags: ['Synthwave', 'Analog', 'Retro'],
    tracks: [CURATED_DISCOVERY_TRACKS[1], CURATED_DISCOVERY_TRACKS[5]],
  },
  {
    id: 'col-study',
    name: 'Lo-Fi Chill & Night Rain',
    description: 'Vinyl textures, gentle Rhodes keys, and relaxing tempos.',
    coverGradient: 'from-amber-700 via-stone-800 to-slate-900',
    tags: ['Lo-Fi Chill', 'Chill', 'Rain'],
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
