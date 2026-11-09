import React, { useState, useEffect, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { SongObjectCard } from '../common/SongObjectCard';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { 
  Play, 
  Pause, 
  Sparkles, 
  Plus, 
  Radio, 
  ListMusic, 
  Flame, 
  Layers, 
  HardDrive, 
  ChevronRight, 
  Clock, 
  Heart, 
  Music,
  Disc,
  Compass,
  ArrowUpRight,
  Headphones,
  SlidersHorizontal,
  Activity
} from 'lucide-react';
import { 
  CURATED_COLLECTIONS, 
  GENRE_MOOD_CATEGORIES 
} from '../../services/discoveryService';
import { jamendoProvider } from '../../services/providers/jamendoProvider';
import { audiusService } from '../../services/audiusService';
import { radioBrowserProvider } from '../../services/providers/radioBrowserProvider';
import { unifiedTrackToAuraTrack, radioStationToAuraTrack } from '../../services/providers/types';
import { Track } from '../../types';

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
    setSelectedPlaylistId,
    setCurrentView,
    setSearchQuery,
    setIsUploadModalOpen,
    loadDemoPack,
    setIsExpandedPlayerOpen,
    setIsAudioControlsOpen,
  } = useMusic();

  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);

  // Dynamic Discovery States
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [topRadioStations, setTopRadioStations] = useState<Track[]>([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(true);

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

  // Jump Back In (Recent tracks)
  const jumpBackInTracks = useMemo(() => {
    const list = (recentlyPlayed && recentlyPlayed.length > 0
      ? recentlyPlayed.map((rp) => rp.track)
      : history
    ).filter(Boolean);
    return list.slice(0, 6);
  }, [recentlyPlayed, history]);

  // Featured Spotlight Track
  const spotlightTrack = useMemo<Track | null>(() => {
    if (currentTrack) return currentTrack;
    if (jumpBackInTracks.length > 0) return jumpBackInTracks[0];
    if (tracks.length > 0) return tracks[0];
    if (trendingTracks.length > 0) return trendingTracks[0];
    return null;
  }, [currentTrack, jumpBackInTracks, tracks, trendingTracks]);

  const isSpotlightPlaying = currentTrack?.id === spotlightTrack?.id && isPlaying;

  const handleSpotlightAction = () => {
    if (!spotlightTrack) return;
    if (currentTrack?.id === spotlightTrack.id) {
      togglePlay();
    } else {
      playTrack(spotlightTrack, jumpBackInTracks.length > 0 ? jumpBackInTracks : tracks);
    }
  };

  const handleSelectGenre = (genreQuery: string) => {
    setSearchQuery(genreQuery);
    setCurrentView('songs');
  };

  return (
    <div className="flex flex-col gap-8 sm:gap-12 p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto select-none">
      
      {/* -------------------------------------------------------------
          1. AURA SPATIAL LIVING SPOTLIGHT STAGE
          ------------------------------------------------------------- */}
      {spotlightTrack ? (
        <section 
          id="home-spotlight-hero"
          className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden aura-glass-island"
        >
          {/* Sound-Reactive Ambient Artwork Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {spotlightTrack.coverUrl ? (
              <img 
                src={spotlightTrack.coverUrl} 
                alt="" 
                className="w-full h-full object-cover scale-115 blur-3xl opacity-20 filter brightness-65"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-950/25 via-zinc-900/40 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#030407] via-[#030407]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030407] via-[#030407]/50 to-transparent" />
          </div>

          {/* Controlled Foreground Hero Content */}
          <div className="relative z-10 flex flex-col md:flex-row items-center sm:items-start md:items-center justify-between p-4 sm:p-6 lg:p-8 gap-4 sm:gap-6">
            
            {/* Left: Artwork as Primary Anchor + Metadata */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5 sm:gap-6 flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left">
              
              {/* Primary Artwork Stage */}
              <div 
                onClick={handleSpotlightAction}
                className="relative group shrink-0 w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 cursor-pointer bg-zinc-900"
                title="Play / Pause Spotlight"
              >
                {spotlightTrack.coverUrl ? (
                  <img 
                    src={spotlightTrack.coverUrl} 
                    alt={spotlightTrack.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${spotlightTrack.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
                    <Music className="w-12 h-12 text-white/50" />
                  </div>
                )}

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl group-hover:scale-110 active:scale-95 transition-transform">
                    {isSpotlightPlaying ? (
                      <Pause className="w-5 h-5 fill-current text-black" />
                    ) : (
                      <Play className="w-5 h-5 fill-current text-black translate-x-0.5" />
                    )}
                  </div>
                </div>

                {/* Live Animated Equalizer Signal */}
                {isSpotlightPlaying && (
                  <div className="absolute bottom-2 left-2 flex items-end gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/15">
                    <span className="w-1 h-3 bg-sky-400 rounded-full animate-pulse" />
                    <span className="w-1 h-4.5 bg-indigo-300 rounded-full animate-[pulse_0.7s_ease-in-out_infinite]" />
                    <span className="w-1 h-2 bg-white rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
                  </div>
                )}
              </div>

              {/* Spotlight Metadata & Actions */}
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5 flex-wrap text-xs font-mono">
                  <span className="text-[10px] tracking-widest text-sky-400 font-medium uppercase">
                    {currentTrack?.id === spotlightTrack.id ? 'Now Playing' : 'Spotlight'}
                  </span>
                  <span className="text-zinc-600 text-xs" aria-hidden="true">·</span>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                    {spotlightTrack.source?.toUpperCase() || 'LOCAL VAULT'}
                  </span>
                  {spotlightTrack.fileFormat && (
                    <>
                      <span className="text-zinc-600 text-xs font-mono hidden sm:inline" aria-hidden="true">·</span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase hidden sm:inline">
                        {spotlightTrack.fileFormat}
                      </span>
                    </>
                  )}
                </div>

                <h1 
                  onClick={() => setIsExpandedPlayerOpen(true)}
                  className="text-xl sm:text-2xl lg:text-3xl font-page-title text-white hover:text-zinc-200 cursor-pointer transition-colors line-clamp-2 leading-snug"
                  title={spotlightTrack.title}
                >
                  {spotlightTrack.title}
                </h1>

                <p className="text-xs sm:text-sm font-artist-name text-zinc-300 mt-1 truncate max-w-lg">
                  {spotlightTrack.artist}
                  {spotlightTrack.album && (
                    <span className="text-zinc-500 font-normal"> · {spotlightTrack.album}</span>
                  )}
                </p>

                {/* Primary Action Buttons */}
                <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-4">
                  <button
                    type="button"
                    onClick={handleSpotlightAction}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-100 active:scale-95 text-zinc-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer aura-focus-ring"
                  >
                    {isSpotlightPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-current text-black" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current text-black translate-x-0.5" />
                        <span>Play Now</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExpandedPlayerOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white font-medium text-xs border border-white/10 transition-colors cursor-pointer aura-focus-ring"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Expand Canvas</span>
                  </button>
                </div>

              </div>

            </div>

            {/* Right: Sound Lab Clean Integration Strip (Desktop) */}
            <div className="hidden lg:flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] w-64 shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[11px] font-semibold text-white">Audio Engine</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 font-bold">DSP READY</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>Signal Format:</span>
                <span className="text-zinc-200 font-semibold">{spotlightTrack.fileFormat || 'PCM 48kHz'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>DSP Architecture:</span>
                <span className="text-indigo-300">10-Band EQ · 3D</span>
              </div>

              <button
                type="button"
                onClick={() => setIsAudioControlsOpen(true)}
                className="mt-1 w-full py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-semibold text-zinc-200 hover:text-white border border-white/[0.08] transition-colors flex items-center justify-center gap-1.5 cursor-pointer aura-focus-ring"
              >
                <SlidersHorizontal className="w-3 h-3 text-sky-400" />
                <span>Audio Studio & DSP</span>
              </button>
            </div>

          </div>
        </section>
      ) : null}

      {/* -------------------------------------------------------------
          2. "JUMP BACK IN" — COMPACT HORIZONTAL RESUME SHELF
          ------------------------------------------------------------- */}
      {jumpBackInTracks.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h2 className="font-section-title text-white">
                Jump Back In
              </h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono hidden sm:inline">Recent Listening Flow</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {jumpBackInTracks.map((track) => {
              const isThisTrackPlaying = currentTrack?.id === track.id && isPlaying;
              return (
                <div
                  key={`resume-${track.id}`}
                  onClick={() => playTrack(track, jumpBackInTracks)}
                  className={`group relative flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer aura-focus-ring ${
                    currentTrack?.id === track.id
                      ? 'aura-glass-ambient border-white/25 shadow-lg'
                      : 'aura-glass-ambient'
                  }`}
                >
                  {/* Artwork */}
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/10 shadow-sm">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-zinc-800 to-black'} flex items-center justify-center`}>
                        <Music className="w-4 h-4 text-zinc-400" />
                      </div>
                    )}
                    
                    {/* Micro Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-6 h-6 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-md">
                        {isThisTrackPlaying ? (
                          <Pause className="w-3 h-3 fill-current text-black" />
                        ) : (
                          <Play className="w-3 h-3 fill-current text-black translate-x-0.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-xs font-semibold truncate leading-tight ${currentTrack?.id === track.id ? 'text-white' : 'text-zinc-200 group-hover:text-white'}`}>
                      {track.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>

                  {/* Active Indicator Waveform */}
                  {isThisTrackPlaying && (
                    <div className="flex items-end gap-0.5 pr-2 shrink-0">
                      <span className="w-0.5 h-2.5 bg-sky-400 rounded-full animate-pulse" />
                      <span className="w-0.5 h-3.5 bg-indigo-300 rounded-full animate-[pulse_0.7s_ease-in-out_infinite]" />
                      <span className="w-0.5 h-2 bg-white rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          3. FEATURED SPACES & SOUNDSCAPES (Editorial Cards Shelf)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-indigo-400" />
            <h2 className="font-section-title text-white">
              Featured Spaces & Soundscapes
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('playlists')}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            All Spaces <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CURATED_COLLECTIONS.slice(0, 4).map((col) => (
            <div
              key={col.id}
              onClick={() => playTrack(col.tracks[0], col.tracks)}
              className="group relative flex flex-col justify-between p-4 rounded-2xl aura-glass-ambient transition-all duration-300 cursor-pointer min-h-[145px]"
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
          4. DYNAMIC TRENDING & OPEN DISCOVERY (Curated Music Objects)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            <h2 className="font-section-title text-white">
              Trending Music & Community Discoveries
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('sources')}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            Explore Sources <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {trendingTracks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-5">
            {trendingTracks.map((track) => (
              <SongObjectCard
                key={`trending-${track.id}`}
                track={track}
                playlistContext={trendingTracks}
                variant="grid"
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl aura-glass-ambient text-center text-xs text-zinc-400 font-mono">
            {isLoadingDiscovery ? 'Synthesizing global open streaming discoveries...' : 'Trending catalog ready.'}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          5. TOP GLOBAL LIVE RADIO RADAR (Compact Badged Shelf)
          ------------------------------------------------------------- */}
      {topRadioStations.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              <h2 className="font-section-title text-white">
                Live Broadcast Stations
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCurrentView('sources')}
              className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
            >
              Browse Global Radio <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {topRadioStations.map((station) => (
              <div
                key={`radio-${station.id}`}
                onClick={() => playTrack(station, topRadioStations)}
                className="group relative flex flex-col p-2.5 rounded-xl aura-glass-ambient transition-all cursor-pointer"
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
                    <Radio className="w-6 h-6 text-amber-400/50" />
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
          6. GENRE & MOOD SPECTRUM (Compact Aspect Tiles)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="font-section-title text-white">
              Explore by Genre & Mood
            </h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">Direct Catalog Search</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {GENRE_MOOD_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSelectGenre(cat.query)}
              className="group relative overflow-hidden rounded-xl aspect-[16/10] p-3 flex flex-col justify-end border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer shadow-sm aura-glass-ambient"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.coverGradient} opacity-60 group-hover:opacity-85 transition-opacity`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              
              <div className="relative z-10">
                <h3 className="text-xs font-semibold text-white font-ui-title group-hover:text-sky-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[9px] text-zinc-400 font-ui-meta line-clamp-1 mt-0.5">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          7. LOCAL MUSIC VAULT STATUS & QUICK IMPORT
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
            <p className="text-xs text-zinc-400 mt-0.5">
              {tracks.length > 0 
                ? `${tracks.length} audio tracks stored in IndexedDB offline storage.`
                : 'Import local FLAC, MP3, WAV or AAC files for lossless browser-native listening.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer aura-focus-ring"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Import Audio</span>
          </button>
          {tracks.length === 0 && (
            <button
              type="button"
              onClick={loadDemoPack}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 font-medium text-xs border border-white/10 transition-colors cursor-pointer aura-focus-ring"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Demo Pack</span>
            </button>
          )}
        </div>
      </section>

      {/* Add To Playlist Modal */}
      {playlistModalTrack && (
        <AddToPlaylistModal
          track={playlistModalTrack}
          isOpen={Boolean(playlistModalTrack)}
          onClose={() => setPlaylistModalTrack(null)}
        />
      )}

    </div>
  );
};

