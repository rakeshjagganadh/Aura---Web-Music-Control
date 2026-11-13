import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { useMusic } from '../../context/MusicContext';
import { SongObjectCard } from '../common/SongObjectCard';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { YouTubePlaylistImportModal } from '../playlists/YouTubePlaylistImportModal';
import { MotionFadeSlide } from '../common/motion/MotionSurface';
import { MotionIconSwap } from '../common/motion/MotionInteractive';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';
import { 
  Play, 
  Pause, 
  Sparkles, 
  Plus, 
  Radio as RadioIcon, 
  ListMusic, 
  Flame, 
  Layers, 
  HardDrive, 
  ChevronRight, 
  Clock, 
  Heart, 
  Music,
  Compass,
  ArrowUpRight,
  Sun,
  Moon,
  CloudSun,
  Zap,
  Waves,
  Headphones,
  SlidersHorizontal,
  Shuffle
} from 'lucide-react';
import { 
  CURATED_COLLECTIONS, 
  SONIC_ENVIRONMENTS,
  CURATED_DISCOVERY_TRACKS
} from '../../services/discoveryService';
import { nativeDiscoveryService, AuraDiscoveryMix } from '../../services/nativeDiscoveryService';
import { jamendoProvider } from '../../services/providers/jamendoProvider';
import { audiusService } from '../../services/audiusService';
import { radioBrowserProvider } from '../../services/providers/radioBrowserProvider';
import { unifiedTrackToAuraTrack, radioStationToAuraTrack } from '../../services/providers/types';
import { Track } from '../../types';

// Genuine Music Genres with provider search queries
const GENUINE_GENRES = [
  { id: 'genre-electronic', name: 'Electronic', query: 'electronic', color: 'from-cyan-500/20 to-indigo-950/80', border: 'border-cyan-500/30', tag: 'Synthesizers & Beats' },
  { id: 'genre-indie', name: 'Indie & Alt', query: 'indie', color: 'from-amber-500/20 to-stone-950/80', border: 'border-amber-500/30', tag: 'Guitar & Alternative' },
  { id: 'genre-lofi', name: 'Lo-Fi Chill', query: 'lofi', color: 'from-amber-600/20 to-slate-950/80', border: 'border-amber-600/30', tag: 'Dusty Beats & Keys' },
  { id: 'genre-hiphop', name: 'Hip-Hop', query: 'hiphop', color: 'from-rose-500/20 to-zinc-950/80', border: 'border-rose-500/30', tag: 'Flow & Kinetic Drums' },
  { id: 'genre-classical', name: 'Classical', query: 'classical', color: 'from-blue-600/20 to-slate-950/80', border: 'border-blue-500/30', tag: 'Symphonic & Piano' },
  { id: 'genre-jazz', name: 'Jazz & Soul', query: 'jazz', color: 'from-orange-500/20 to-zinc-950/80', border: 'border-orange-500/30', tag: 'Brass & Warm Chords' },
  { id: 'genre-ambient', name: 'Ambient', query: 'ambient', color: 'from-emerald-500/20 to-teal-950/80', border: 'border-emerald-500/30', tag: 'Textural Drones' },
  { id: 'genre-rock', name: 'Rock', query: 'rock', color: 'from-purple-500/20 to-slate-950/80', border: 'border-purple-500/30', tag: 'Driven Amps & Grooves' },
];

// 8 Expressive Mood Cards with bespoke visual styling
const MOOD_CARDS = [
  { id: 'deep-focus', name: 'Deep Focus', query: 'focus', gradient: 'from-sky-500/25 via-indigo-950/60 to-[#07090e]', border: 'border-sky-500/30 hover:border-sky-400/60', badgeColor: 'text-sky-300 bg-sky-500/10', desc: 'Minimal ambient & study flows' },
  { id: 'night-drive', name: 'Night Drive', query: 'synthwave', gradient: 'from-purple-500/25 via-fuchsia-950/60 to-[#07090e]', border: 'border-purple-500/30 hover:border-purple-400/60', badgeColor: 'text-purple-300 bg-purple-500/10', desc: 'Retrowave & nocturnal synths' },
  { id: 'feel-good', name: 'Feel Good', query: 'upbeat', gradient: 'from-amber-500/25 via-rose-950/60 to-[#07090e]', border: 'border-amber-500/30 hover:border-amber-400/60', badgeColor: 'text-amber-300 bg-amber-500/10', desc: 'Vibrant melodies & warm grooves' },
  { id: 'late-night', name: 'Late Night Chill', query: 'chill', gradient: 'from-blue-600/25 via-slate-900/60 to-[#07090e]', border: 'border-blue-500/30 hover:border-blue-400/60', badgeColor: 'text-blue-300 bg-blue-500/10', desc: 'Slow tempos & moody textures' },
  { id: 'calm-ambient', name: 'Calm & Ambient', query: 'ambient', gradient: 'from-emerald-500/25 via-teal-950/60 to-[#07090e]', border: 'border-emerald-500/30 hover:border-emerald-400/60', badgeColor: 'text-emerald-300 bg-emerald-500/10', desc: 'Generative soundscapes & drone' },
  { id: 'energy-boost', name: 'Energy Boost', query: 'dance', gradient: 'from-rose-500/25 via-orange-950/60 to-[#07090e]', border: 'border-rose-500/30 hover:border-rose-400/60', badgeColor: 'text-rose-300 bg-rose-500/10', desc: 'High BPM kinetic rhythms' },
  { id: 'retro-vibes', name: 'Retro Vibes', query: 'retro', gradient: 'from-violet-500/25 via-purple-950/60 to-[#07090e]', border: 'border-violet-500/30 hover:border-violet-400/60', badgeColor: 'text-violet-300 bg-violet-500/10', desc: '80s analog synths & tape warmth' },
  { id: 'electronic-escape', name: 'Electronic Escape', query: 'electronic', gradient: 'from-cyan-500/25 via-blue-950/60 to-[#07090e]', border: 'border-cyan-500/30 hover:border-cyan-400/60', badgeColor: 'text-cyan-300 bg-cyan-500/10', desc: 'Immersive sound design & bass' },
];

export const HomeView: React.FC = () => {
  const {
    tracks,
    isPlaying,
    currentTrack,
    playTrack,
    togglePlay,
    history,
    recentlyPlayed,
    favoriteItems,
    playlists,
    setCurrentView,
    setSearchQuery,
    setIsUploadModalOpen,
    loadDemoPack,
    setIsExpandedPlayerOpen,
    setIsAudioControlsOpen,
    isYouTubeImportModalOpen,
    setIsYouTubeImportModalOpen,
  } = useMusic();

  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const { canHover, prefersReducedMotion } = useMotionCapabilities();

  // Dynamic Discovery States
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [topRadioStations, setTopRadioStations] = useState<Track[]>([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(true);

  // Time-of-day greeting calculation
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good Morning', icon: Sun, label: 'Morning Ritual' };
    if (hour >= 12 && hour < 18) return { text: 'Good Afternoon', icon: CloudSun, label: 'Daytime Flow' };
    return { text: 'Good Evening', icon: Moon, label: 'Night Sanctuary' };
  }, []);

  // Fetch verified online streaming discovery
  useEffect(() => {
    let isMounted = true;
    async function loadDiscoveries() {
      setIsLoadingDiscovery(true);
      try {
        const [jamRes, audRes, radioRes] = await Promise.allSettled([
          jamendoProvider.getTrending({ limit: 8 }),
          audiusService.getTrending(8),
          radioBrowserProvider.getTopVotedStations(6),
        ]);

        if (isMounted) {
          const combined: Track[] = [];
          if (jamRes.status === 'fulfilled' && jamRes.value.length > 0) {
            combined.push(...jamRes.value.map((u) => unifiedTrackToAuraTrack(u)));
          }
          if (audRes.status === 'fulfilled' && audRes.value.items) {
            combined.push(...audRes.value.items);
          }
          setTrendingTracks(combined.slice(0, 8));

          if (radioRes.status === 'fulfilled' && radioRes.value.length > 0) {
            setTopRadioStations(radioRes.value.map((st) => radioStationToAuraTrack(st)));
          }
        }
      } catch (err) {
        console.warn('HomeView discovery load error:', err);
      } finally {
        if (isMounted) setIsLoadingDiscovery(false);
      }
    }

    loadDiscoveries();
    return () => { isMounted = false; };
  }, []);

  // AURA-Native Music Discovery Mixes (Daily Flow, Your Rotation, Vault Rewind, Deep Focus, Energy Boost)
  const discoveryMixes = useMemo(() => {
    return nativeDiscoveryService.getAllMixes({
      tracks,
      recentlyPlayed,
      favoriteItems,
      history,
    });
  }, [tracks, recentlyPlayed, favoriteItems, history]);

  // Handle Play Discovery Mix (sequential or shuffle)
  const handlePlayDiscoveryMix = (mix: AuraDiscoveryMix, shuffle = false) => {
    if (!mix.tracks || mix.tracks.length === 0) return;
    const queue = shuffle ? [...mix.tracks].sort(() => Math.random() - 0.5) : mix.tracks;
    playTrack(queue[0], queue);
  };

  // Quick Picks pool (derived from recent, favorites, local tracks, or open streams)
  const quickPicks = useMemo(() => {
    const pool: Track[] = [];
    const seen = new Set<string>();

    const addTrack = (t: Track) => {
      if (t && !seen.has(t.id)) {
        seen.add(t.id);
        pool.push(t);
      }
    };

    recentlyPlayed?.forEach((rp) => rp.track && addTrack(rp.track));
    favoriteItems?.forEach((f) => f.track && addTrack(f.track));
    tracks?.forEach((t) => addTrack(t));
    CURATED_DISCOVERY_TRACKS.forEach((t) => addTrack(t));
    trendingTracks?.forEach((t) => addTrack(t));

    return pool.slice(0, 8);
  }, [recentlyPlayed, favoriteItems, tracks, trendingTracks]);

  // Handle Daily Sanctuary Mix Playback Trigger
  const handlePlayDailyMix = () => {
    const dailyMix = discoveryMixes.find((m) => m.id === 'daily-flow');
    if (dailyMix && dailyMix.tracks.length > 0) {
      playTrack(dailyMix.tracks[0], dailyMix.tracks);
      return;
    }
    const mixQueue = quickPicks.length > 0 ? quickPicks : CURATED_DISCOVERY_TRACKS;
    if (mixQueue.length > 0) {
      playTrack(mixQueue[0], mixQueue);
    }
  };

  const handleSelectMood = (moodQuery: string) => {
    setSearchQuery(moodQuery);
    setCurrentView('songs');
  };

  const handleSelectGenre = (genreQuery: string) => {
    setSearchQuery(genreQuery);
    setCurrentView('songs');
  };

  const GreetingIcon = greeting.icon;

  return (
    <div className="flex flex-col gap-8 sm:gap-10 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none pb-36 sm:pb-44">
      
      {/* -------------------------------------------------------------
          1. COMPACT TIME-AWARE GREETING & QUICK LISTENING ACTION BAR
          ------------------------------------------------------------- */}
      <section id="home-welcome-header" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GreetingIcon className="w-4 h-4 text-sky-400" />
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-medium">
              {greeting.label}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-page-title text-white tracking-tight">
            {greeting.text}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-ui-meta">
            Your audio sanctuary is online · {quickPicks.length} instant tracks ready
          </p>
        </div>

        {/* Quick Action Mix Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePlayDailyMix}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs shadow-md aura-pressable transition-colors cursor-pointer aura-focus-ring"
            title="Play Sanctuary Daily Flow Mix"
          >
            <Play className="w-3.5 h-3.5 fill-current text-black" />
            <span>Daily Sanctuary Mix</span>
          </button>

          <button
            type="button"
            onClick={() => setIsYouTubeImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/25 aura-pressable transition-colors cursor-pointer aura-focus-ring"
            title="Import YouTube or YouTube Music Playlist"
          >
            <ListMusic className="w-3.5 h-3.5 text-red-400" />
            <span>Import YouTube Playlist</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('library')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium border border-white/10 aura-pressable transition-colors cursor-pointer aura-focus-ring"
            title="Open Personal Vault Overview"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span>Personal Vault</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('sources')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 text-xs font-medium border border-white/10 aura-pressable transition-colors cursor-pointer aura-focus-ring"
            title="Open Live World Radio"
          >
            <RadioIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Radio</span>
          </button>
        </div>
      </section>

      {/* -------------------------------------------------------------
          2. QUICK PICKS — TACTILE INSTANT-PLAY GRID (~60px ARTWORK TILES)
          ------------------------------------------------------------- */}
      {quickPicks.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-section-title text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" />
              Quick Picks
            </h2>
            <span className="text-xs text-zinc-500 font-mono hidden sm:inline">Instant Play</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickPicks.map((track) => {
              const isThisPlaying = currentTrack?.id === track.id && isPlaying;
              return (
                <div
                  key={`quick-pick-${track.id}`}
                  onClick={() => playTrack(track, quickPicks)}
                  className={`group relative flex items-center gap-3.5 p-2.5 rounded-2xl aura-hover-scale aura-pressable-subtle transition-colors duration-200 cursor-pointer aura-focus-ring ${
                    currentTrack?.id === track.id
                      ? 'bg-white/[0.10] border border-sky-400/50 shadow-md'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* ~54px Tactile Artwork Tile */}
                  <div className="relative w-13 h-13 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/20 shadow-md">
                    {track.coverUrl ? (
                      <img 
                        src={track.coverUrl} 
                        alt={track.title} 
                        className={`w-full h-full object-cover transition-transform duration-300 ${canHover ? 'group-hover:scale-105' : ''}`}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-900 to-black'} flex items-center justify-center`}>
                        <Music className="w-5 h-5 text-white/60" />
                      </div>
                    )}

                    {/* Micro Play Hover Button */}
                    <div className={`absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity ${isThisPlaying ? 'opacity-100' : canHover ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                      <div className={`w-7 h-7 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg active:scale-95 transition-transform ${canHover ? 'group-hover:scale-110' : ''}`}>
                        <MotionIconSwap stateKey={isThisPlaying ? 'pause' : 'play'}>
                          {isThisPlaying ? (
                            <Pause className="w-3.5 h-3.5 fill-current text-black" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current text-black translate-x-0.5" />
                          )}
                        </MotionIconSwap>
                      </div>
                    </div>
                  </div>

                  {/* Title & Artist */}
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-xs font-semibold truncate leading-tight ${currentTrack?.id === track.id ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                      {track.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-ui-meta group-hover:text-zinc-300 transition-colors">
                      {track.artist}
                    </p>
                  </div>

                  {/* Active Equalizer Signal */}
                  {isThisPlaying && (
                    <div className="flex items-end gap-0.5 pr-2 shrink-0">
                      <span className={`w-0.5 h-3 bg-sky-400 rounded-full ${!prefersReducedMotion ? 'animate-pulse' : ''}`} />
                      <span className={`w-0.5 h-4 bg-indigo-300 rounded-full ${!prefersReducedMotion ? 'animate-[pulse_0.7s_ease-in-out_infinite]' : ''}`} />
                      <span className={`w-0.5 h-2.5 bg-white rounded-full ${!prefersReducedMotion ? 'animate-[pulse_1s_ease-in-out_infinite]' : ''}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          3. YOUR MUSIC DISCOVERY (NATIVE AURA MIXES + PLAYLIST IMPORT)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-section-title text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Your Music Discovery
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 font-ui-meta">
              Personalized listening experiences assembled natively from your library, playback history, and vault
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsYouTubeImportModalOpen(true)}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/25 aura-pressable transition-colors cursor-pointer aura-focus-ring"
          >
            <ListMusic className="w-3.5 h-3.5 text-red-400" />
            <span>Import YouTube Playlist</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discoveryMixes.map((mix) => {
            const isPlayingThisMix = currentTrack && mix.tracks.some((t) => t.id === currentTrack.id) && isPlaying;

            return (
              <div
                key={mix.id}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.22] glass-ambient hover:glass-reflective aura-hover-scale flex flex-col justify-between transition-colors duration-300 hover:border-white/40 shadow-xl hover:shadow-2xl"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${mix.coverColor} opacity-70 group-hover:opacity-85 transition-opacity`} />

                {/* Top Section: Badges, Real Artwork and Descriptions */}
                <div className="relative z-10 p-5 flex items-start gap-4">
                  {/* Real Artwork Tile */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-zinc-900 border border-white/20 shadow-lg">
                    {mix.coverUrl ? (
                      <img
                        src={mix.coverUrl}
                        alt={mix.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <Music className="w-7 h-7 text-white/50" />
                      </div>
                    )}

                    {/* Quick Play Overlay */}
                    <button
                      type="button"
                      onClick={() => handlePlayDiscoveryMix(mix, false)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                      title={`Play ${mix.title}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg transform group-hover:scale-105 active:scale-95 transition-transform">
                        <Play className="w-4 h-4 fill-current text-black translate-x-0.5" />
                      </div>
                    </button>
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
                          {mix.badgeText}
                        </span>
                        {mix.isStarterMix ? (
                          <span className="text-[9px] font-mono text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/25">
                            STARTER
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25">
                            PERSONALIZED
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors font-display truncate">
                        {mix.title}
                      </h3>

                      <p className="text-xs text-zinc-300 line-clamp-2 mt-0.5 leading-snug">
                        {mix.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono mt-2">
                      <span>{mix.trackCount} tracks ready</span>
                      {isPlayingThisMix && (
                        <span className="flex items-center gap-1 text-sky-400 font-bold">
                          <span className={`w-1.5 h-1.5 rounded-full bg-sky-400 ${!prefersReducedMotion ? 'animate-pulse' : ''}`} />
                          Playing
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Honest Provenance & Controls */}
                <div className="relative z-10 px-5 pb-4 pt-2 flex items-center justify-between border-t border-white/[0.06] bg-black/20">
                  <p className="text-[11px] text-zinc-400 font-mono line-clamp-1 flex-1 pr-3" title={mix.reason}>
                    {mix.reason}
                  </p>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePlayDiscoveryMix(mix, true)}
                      className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white aura-pressable transition-colors cursor-pointer aura-focus-ring"
                      title="Shuffle Mix"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePlayDiscoveryMix(mix, false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs aura-pressable transition-colors cursor-pointer aura-focus-ring shadow"
                      title={`Play ${mix.title}`}
                    >
                      <Play className="w-3 h-3 fill-current text-black translate-x-0.2" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick-Launcher Card for YouTube Playlist Import */}
          <div
            onClick={() => setIsYouTubeImportModalOpen(true)}
            className="group relative overflow-hidden rounded-2xl border border-red-500/20 hover:border-red-500/40 aura-glass-ambient aura-hover-scale aura-pressable-subtle flex flex-col justify-between transition-colors duration-300 shadow-lg cursor-pointer min-h-[160px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-zinc-900/60 to-black/80 opacity-80 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10 p-5 flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400 group-hover:scale-105 transition-transform">
                <ListMusic className="w-8 h-8" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-300 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/25">
                  OFFICIAL STREAMING
                </span>
                <h3 className="text-base font-bold text-white group-hover:text-red-200 transition-colors font-display mt-1">
                  Import YouTube Playlist
                </h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  Paste any YouTube or YouTube Music playlist URL or ID to stream officially inside AURA.
                </p>
              </div>
            </div>

            <div className="relative z-10 px-5 pb-4 pt-2 flex items-center justify-between border-t border-white/[0.06] bg-black/20">
              <span className="text-[11px] font-mono text-zinc-400">
                Official YouTube IFrame Player API
              </span>
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold text-xs transition-transform active:scale-95 cursor-pointer shadow"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Import</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          4. EXPLORE BY MOOD (8 EXPRESSIVE MOOD CARDS)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-section-title text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-purple-400" />
            Explore by Mood
          </h2>
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">Sonic Mood Filter</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MOOD_CARDS.map((mood) => (
            <div
              key={mood.id}
              onClick={() => handleSelectMood(mood.query)}
              className={`group relative overflow-hidden rounded-3xl aspect-[16/9] p-4 flex flex-col justify-between border ${mood.border} transition-colors duration-300 cursor-pointer glass-ambient hover:glass-reflective aura-hover-scale aura-pressable-subtle shadow-lg hover:shadow-2xl`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${mood.gradient} opacity-75 group-hover:opacity-95 transition-opacity`} />
              
              <div className="relative z-10 flex items-center justify-between">
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/10 ${mood.badgeColor}`}>
                  {mood.name.toUpperCase()}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
              </div>

              <div className="relative z-10">
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-200 transition-colors font-display">
                  {mood.name}
                </h3>
                <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 font-ui-meta">
                  {mood.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          5. EXPLORE GENRES (GENUINE MUSIC GENRES CONNECTED TO SEARCH)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-section-title text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Explore Genres
          </h2>
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">Provider Catalog Search</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {GENUINE_GENRES.map((g) => (
            <div
              key={g.id}
              onClick={() => handleSelectGenre(g.query)}
              className={`group relative overflow-hidden rounded-xl aspect-[4/3] p-3 flex flex-col justify-between border ${g.border} transition-colors duration-200 cursor-pointer aura-glass-ambient aura-hover-scale aura-pressable-subtle shadow-sm`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${g.color} opacity-70 group-hover:opacity-95 transition-opacity`} />
              
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider">GENRE</span>
              </div>

              <div className="relative z-10">
                <h3 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors font-display">
                  {g.name}
                </h3>
                <p className="text-[9px] text-zinc-400 line-clamp-1 mt-0.5 font-ui-meta">
                  {g.tag}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          6. EXPLORE SOUNDSCAPES (AURA CURATED SOUND CONCEPTS)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-section-title text-white flex items-center gap-2">
            <Waves className="w-4 h-4 text-emerald-400" />
            Explore Soundscapes
          </h2>
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">AURA Sonic Environments</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {SONIC_ENVIRONMENTS.map((env) => (
            <div
              key={env.id}
              onClick={() => playTrack(env.featuredTrack, [env.featuredTrack])}
              className="group relative overflow-hidden rounded-xl aspect-[16/10] p-3 flex flex-col justify-between border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer aura-glass-ambient aura-hover-scale aura-pressable-subtle shadow-sm"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${env.coverGradient} opacity-60 group-hover:opacity-85 transition-opacity`} />
              
              <div className="relative z-10 flex items-start justify-between">
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 border border-white/10">
                  SOUNDSCAPE
                </span>
                <div className="w-6 h-6 rounded-full bg-white text-zinc-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-3 h-3 fill-current text-black translate-x-0.5" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors font-display">
                  {env.name}
                </h3>
                <p className="text-[9px] text-zinc-400 line-clamp-1 mt-0.5 font-ui-meta">
                  {env.tagline}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          7. NEW & TRENDING DISCOVERIES (LIVE STREAM OBJECTS)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-section-title text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            Trending & Open Discoveries
          </h2>
          <button
            type="button"
            onClick={() => setCurrentView('sources')}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            All Sources <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {trendingTracks.length > 0 ? (
            <MotionFadeSlide
              key="discovery-tracks"
              direction="up"
              distance={6}
              duration="micro"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-5"
            >
              {trendingTracks.map((track) => (
                <SongObjectCard
                  key={`trending-${track.id}`}
                  track={track}
                  playlistContext={trendingTracks}
                  variant="grid"
                  onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
                />
              ))}
            </MotionFadeSlide>
          ) : isLoadingDiscovery ? (
            <MotionFadeSlide
              key="discovery-loading"
              direction="up"
              distance={4}
              duration="micro"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-5"
              aria-busy="true"
              aria-label="Loading live open streaming discoveries"
            >
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="w-full aspect-square rounded-2xl aura-skeleton border border-white/[0.08]" />
                  <div className="mt-2.5 px-0.5 flex flex-col gap-1.5">
                    <div className="h-3.5 w-3/4 rounded aura-skeleton" />
                    <div className="h-3 w-1/2 rounded aura-skeleton" />
                  </div>
                </div>
              ))}
            </MotionFadeSlide>
          ) : (
            <MotionFadeSlide
              key="discovery-empty"
              direction="up"
              distance={4}
              duration="micro"
              className="p-6 rounded-2xl aura-glass-ambient text-center text-xs text-zinc-400 font-mono"
            >
              No trending discoveries available right now.
            </MotionFadeSlide>
          )}
        </AnimatePresence>
      </section>

      {/* -------------------------------------------------------------
          8. TOP GLOBAL RADIO STATIONS
          ------------------------------------------------------------- */}
      {topRadioStations.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-section-title text-white flex items-center gap-2">
              <RadioIcon className="w-4 h-4 text-amber-400" />
              Live Broadcast Radio
            </h2>
            <button
              type="button"
              onClick={() => setCurrentView('sources')}
              className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              Radio Radar <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {topRadioStations.map((station) => (
              <div
                key={`radio-${station.id}`}
                onClick={() => playTrack(station, topRadioStations)}
                className="group relative flex flex-col p-2.5 rounded-xl aura-glass-ambient aura-hover-lift aura-pressable-subtle transition-colors cursor-pointer"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-white/10 mb-2 flex items-center justify-center">
                  {station.coverUrl ? (
                    <img 
                      src={station.coverUrl} 
                      alt={station.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 -z-10">
                    <RadioIcon className="w-6 h-6 text-amber-400/50" />
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-current text-black translate-x-0.5" />
                    </div>
                  </div>
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    LIVE
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-white truncate font-ui-title group-hover:text-amber-300">
                  {station.title}
                </h4>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                  {station.artist || 'World Radio'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          9. FEATURED SPACES & SOUNDSCAPES
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-section-title text-white flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-indigo-400" />
            Featured Spaces & Collections
          </h2>
          <button
            type="button"
            onClick={() => setCurrentView('playlists')}
            className="text-xs text-zinc-400 hover:text-white aura-pressable transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            All Spaces <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CURATED_COLLECTIONS.slice(0, 4).map((col) => (
            <div
              key={col.id}
              onClick={() => playTrack(col.tracks[0], col.tracks)}
              className="group relative flex flex-col justify-between p-4 rounded-2xl aura-glass-ambient aura-hover-lift aura-pressable-subtle transition-colors duration-300 cursor-pointer min-h-[145px]"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${col.coverGradient} flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform`}>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div className="flex gap-1">
                  {col.tags.slice(0, 1).map((t) => (
                    <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-xs font-semibold text-white group-hover:text-sky-300 transition-colors font-ui-title">
                  {col.name}
                </h3>
                <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5 font-ui-meta">
                  {col.description}
                </p>
                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-white/[0.06] text-[10px] text-zinc-500 font-mono">
                  <span>{col.tracks.length} ambient streams</span>
                  <span className="text-zinc-300 group-hover:text-white font-semibold flex items-center gap-0.5">
                    Play <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          10. LOCAL VAULT STATUS & QUICK IMPORT FOOTER
          ------------------------------------------------------------- */}
      <section className="p-5 sm:p-6 rounded-2xl aura-glass-ambient flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 text-white">
            <HardDrive className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-ui-title">
              Your Personal Vault
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-ui-meta">
              {tracks.length > 0 
                ? `${tracks.length} audio tracks stored in IndexedDB offline storage.`
                : 'Import local MP3, WAV, FLAC or AAC files for browser-native offline listening.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs shadow-md aura-pressable transition-colors cursor-pointer aura-focus-ring"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Import Audio</span>
          </button>
          {tracks.length === 0 && (
            <button
              type="button"
              onClick={loadDemoPack}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 font-medium text-xs border border-white/10 aura-pressable transition-colors cursor-pointer aura-focus-ring"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Demo Pack</span>
            </button>
          )}
        </div>
      </section>

      {/* End-of-view spatial buffer */}
      <div className="h-8 sm:h-12 shrink-0 flex items-center justify-center text-[10px] font-mono text-zinc-600/40 select-none" aria-hidden="true">
        <span>AURA Audio Sanctuary</span>
      </div>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        track={playlistModalTrack}
        isOpen={Boolean(playlistModalTrack)}
        onClose={() => setPlaylistModalTrack(null)}
      />

      {/* YouTube Playlist Import Modal */}
      <YouTubePlaylistImportModal
        isOpen={isYouTubeImportModalOpen}
        onClose={() => setIsYouTubeImportModalOpen(false)}
      />

    </div>
  );
};
