import React, { useState, useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { AuraBrandMark } from '../common/AuraBrandMark';
import { SongObjectCard } from '../common/SongObjectCard';
import { 
  Play, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Activity,
  HardDrive,
  Compass,
  Music,
  Plus,
  Heart,
  Globe,
  Flame,
  Layers,
  Sparkles,
  ListMusic
} from 'lucide-react';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { 
  CURATED_DISCOVERY_TRACKS, 
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
    setIsUploadModalOpen,
    loadDemoPack,
    setCurrentView,
    setSearchQuery,
    history,
    recentlyPlayed,
    favoriteItems,
    playTrack,
    playlists,
    setSelectedPlaylistId,
    setIsExpandedPlayerOpen,
  } = useMusic();

  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);

  // Dynamic Discovery States
  const [jamendoTrending, setJamendoTrending] = useState<Track[]>([]);
  const [audiusTrending, setAudiusTrending] = useState<Track[]>([]);
  const [topRadioStations, setTopRadioStations] = useState<Track[]>([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(true);

  // Rail scroll refs for desktop navigation
  const genresRailRef = useRef<HTMLDivElement>(null);
  const continueRailRef = useRef<HTMLDivElement>(null);
  const trendingRailRef = useRef<HTMLDivElement>(null);
  const favoritesRailRef = useRef<HTMLDivElement>(null);
  const playlistsRailRef = useRef<HTMLDivElement>(null);
  const radioRailRef = useRef<HTMLDivElement>(null);
  const soundscapesRailRef = useRef<HTMLDivElement>(null);
  const vaultRailRef = useRef<HTMLDivElement>(null);

  const scrollRail = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadDiscoveries() {
      setIsLoadingDiscovery(true);
      try {
        const [jamRes, audRes, radioRes] = await Promise.allSettled([
          jamendoProvider.getTrending({ limit: 12 }),
          audiusService.getTrending(12),
          radioBrowserProvider.getTopVotedStations(12),
        ]);

        if (isMounted) {
          if (jamRes.status === 'fulfilled') {
            const mapped = jamRes.value.map((u) => unifiedTrackToAuraTrack(u));
            setJamendoTrending(mapped);
          }
          if (audRes.status === 'fulfilled' && audRes.value.items) {
            setAudiusTrending(audRes.value.items);
          }
          if (radioRes.status === 'fulfilled') {
            const mappedRadio = radioRes.value.map((st) => radioStationToAuraTrack(st));
            setTopRadioStations(mappedRadio);
          }
        }
      } catch (err) {
        console.warn('HomeView discovery load error:', err);
      } finally {
        if (isMounted) setIsLoadingDiscovery(false);
      }
    }

    loadDiscoveries();
    return () => {
      isMounted = false;
    };
  }, []);

  const recentlyAdded = [...tracks].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, 12);
  const continueListening = (recentlyPlayed && recentlyPlayed.length > 0
    ? recentlyPlayed.map((rp) => rp.track)
    : history
  ).slice(0, 12);

  const favoritedTracks = favoriteItems.slice(0, 12).map((f) => f.track);
  const combinedTrending = [...jamendoTrending, ...audiusTrending].slice(0, 12);

  const handleSelectGenre = (genreQuery: string) => {
    setSearchQuery(genreQuery);
    setCurrentView('songs');
  };

  // Time-of-day greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col gap-8 sm:gap-10 p-4 sm:p-8 max-w-7xl mx-auto select-none">
      
      {/* -------------------------------------------------------------
          1. MUSIC-FIRST GREETING & CONTEXT HEADER
          ------------------------------------------------------------- */}
      <section 
        id="home-greeting-section"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#111420] to-[#0c0e15] border border-white/[0.08] p-5 sm:p-7 flex flex-col gap-5 shadow-xl"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <AuraBrandMark size={18} isPlaying={isPlaying} />
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">
                Listening Lounge
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
              {greeting}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              {isPlaying && currentTrack ? (
                <span className="text-zinc-300">
                  Currently playing <strong className="text-white font-medium">{currentTrack.title}</strong> by {currentTrack.artist}
                </span>
              ) : tracks.length > 0 ? (
                `${tracks.length} tracks in your local vault · Ready to stream across Audius, Jamendo and Live Radio.`
              ) : (
                'Welcome to your personal listening space. Play local files or discover open streaming audio.'
              )}
            </p>
          </div>

          {/* Quick Context / Now Playing Mini Widget */}
          {currentTrack && (
            <div 
              onClick={() => setIsExpandedPlayerOpen(true)}
              className="group cursor-pointer flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/15 transition-all shrink-0 max-w-xs"
              title="Open Expanded Now Playing Player"
            >
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shrink-0 relative">
                {currentTrack.coverUrl ? (
                  <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Music className="w-5 h-5" />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                  {isPlaying ? 'Now Playing' : 'Paused'}
                </span>
                <p className="text-xs font-bold text-white truncate mt-0.5 group-hover:text-zinc-200">
                  {currentTrack.title}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action & Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.06] text-xs z-10">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Music</span>
          </button>

          {tracks.length === 0 && (
            <button
              type="button"
              onClick={loadDemoPack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 font-medium border border-white/[0.08] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Demo Pack</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCurrentView('sources')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>Open Sources</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('playlists')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
          >
            <ListMusic className="w-3.5 h-3.5 text-zinc-400" />
            <span>Your Spaces</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('listen-together')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] transition-colors cursor-pointer ml-auto"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Listen Together</span>
          </button>
        </div>

      </section>

      {/* -------------------------------------------------------------
          2. GENRE & MOOD EXPLORATION RAIL (Target: 175–195px Desktop Rail)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
              Genre & Mood Discovery
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollRail(genresRailRef, 'left')}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRail(genresRailRef, 'right')}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">Real Provider Categories</span>
          </div>
        </div>

        <div 
          ref={genresRailRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto custom-scrollbar snap-x scroll-smooth pb-2"
        >
          {GENRE_MOOD_CATEGORIES.map((cat) => (
            <div 
              key={cat.id} 
              onClick={() => handleSelectGenre(cat.query)}
              className="w-36 sm:w-[185px] shrink-0 snap-start group cursor-pointer flex flex-col gap-2 p-3.5 rounded-2xl bg-[#0e1017] hover:bg-[#131622] border border-white/[0.06] hover:border-indigo-500/30 transition-all shadow-sm"
            >
              <div className={`w-full aspect-square rounded-xl bg-gradient-to-br ${cat.coverGradient} flex items-center justify-center text-white shadow-inner relative overflow-hidden group-hover:scale-[1.02] transition-transform`}>
                <Music className="w-7 h-7 text-white/90" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white">
                    Explore
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 truncate transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. CONTINUE LISTENING (Target: 190–210px Desktop Rail)
          ------------------------------------------------------------- */}
      {continueListening.length > 0 && (
        <section className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
                Continue Listening
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollRail(continueRailRef, 'left')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRail(continueRailRef, 'right')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">Persistent History</span>
            </div>
          </div>

          <div 
            ref={continueRailRef}
            className="flex gap-3 sm:gap-4.5 overflow-x-auto custom-scrollbar snap-x scroll-smooth pb-2"
          >
            {continueListening.map((track) => (
              <div key={`hist-${track.id}`} className="w-36 sm:w-[195px] shrink-0 snap-start">
                <SongObjectCard
                  track={track}
                  playlistContext={continueListening}
                  variant="grid"
                  onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          PLAYLISTS & SPACES SHELF
          ------------------------------------------------------------- */}
      {playlists.length > 0 && (
        <section className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
                Your Spaces & Playlists
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollRail(playlistsRailRef, 'left')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRail(playlistsRailRef, 'right')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('playlists')}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
              >
                All Spaces <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div 
            ref={playlistsRailRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto custom-scrollbar snap-x scroll-smooth pb-2"
          >
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  setSelectedPlaylistId(pl.id);
                  setCurrentView('playlist-detail');
                }}
                className="w-40 sm:w-[185px] shrink-0 snap-start group cursor-pointer flex flex-col gap-2 p-3.5 rounded-2xl bg-[#0e1017] hover:bg-[#131622] border border-white/[0.06] hover:border-indigo-500/30 transition-all shadow-sm"
              >
                <div className={`w-full aspect-square rounded-xl bg-gradient-to-br ${pl.coverGradient || 'from-indigo-600 to-zinc-900'} flex items-center justify-center text-white shadow-inner relative overflow-hidden group-hover:scale-[1.02] transition-transform`}>
                  <ListMusic className="w-7 h-7 text-white/90" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white">
                      Open Space
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 truncate transition-colors">
                    {pl.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                    {pl.trackIds.length} tracks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          4. TRENDING DISCOVERIES (Target: 175–195px Desktop Rail)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
              Trending Music Discoveries
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollRail(trendingRailRef, 'left')}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRail(trendingRailRef, 'right')}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCurrentView('sources')}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
            >
              All Sources <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {combinedTrending.length > 0 ? (
          <div 
            ref={trendingRailRef}
            className="flex gap-3 sm:gap-4.5 overflow-x-auto custom-scrollbar snap-x scroll-smooth pb-2"
          >
            {combinedTrending.map((track) => (
              <div key={track.id} className="w-36 sm:w-[185px] shrink-0 snap-start">
                <SongObjectCard
                  track={track}
                  playlistContext={combinedTrending}
                  variant="grid"
                  onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#0e1017] border border-white/[0.06] text-center text-xs text-zinc-500 font-mono">
            {isLoadingDiscovery ? 'Loading trending music discoveries...' : 'Trending discoveries currently unavailable.'}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          5. YOUR FAVORITES (Target: 175–195px Desktop Rail)
          ------------------------------------------------------------- */}
      {favoritedTracks.length > 0 && (
        <section className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400 fill-current" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
                Your Favorites
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollRail(favoritesRailRef, 'left')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRail(favoritesRailRef, 'right')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView('favorites')}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
              >
                View Favorites <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div 
            ref={favoritesRailRef}
            className="flex gap-3 sm:gap-4.5 overflow-x-auto custom-scrollbar snap-x scroll-smooth pb-2"
          >
            {favoritedTracks.map((track) => (
              <div key={`fav-${track.id}`} className="w-36 sm:w-[185px] shrink-0 snap-start">
                <SongObjectCard
                  track={track}
                  playlistContext={favoritedTracks}
                  variant="grid"
                  onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          6. TOP GLOBAL INTERNET RADIO (Target: 170–190px Desktop Rail)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
              Top Global Internet Radio
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollRail(radioRailRef, 'left')}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRail(radioRailRef, 'right')}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCurrentView('sources')}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
            >
              Radio Browser <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {topRadioStations.length > 0 ? (
          <div 
            ref={radioRailRef}
            className="flex gap-3 sm:gap-4.5 overflow-x-auto custom-scrollbar snap-x scroll-smooth pb-2"
          >
            {topRadioStations.map((stationTrack) => (
              <div key={stationTrack.id} className="w-36 sm:w-[180px] shrink-0 snap-start">
                <SongObjectCard
                  track={stationTrack}
                  playlistContext={topRadioStations}
                  variant="grid"
                  onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#0e1017] border border-white/[0.06] text-center text-xs text-zinc-500 font-mono">
            {isLoadingDiscovery ? 'Querying global radio directory...' : 'Internet radio stations currently unavailable.'}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          7. CURATED SOUNDSCAPES (Target: 175–195px Desktop Rail)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
              Curated Soundscapes
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollRail(soundscapesRailRef, 'left')}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRail(soundscapesRailRef, 'right')}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-zinc-500 font-mono">Ambient Streams</span>
          </div>
        </div>

        <div 
          ref={soundscapesRailRef}
          className="flex gap-3 sm:gap-4.5 overflow-x-auto custom-scrollbar snap-x scroll-smooth pb-2"
        >
          {CURATED_COLLECTIONS.map((col) => (
            <div
              key={col.id}
              onClick={() => playTrack(col.tracks[0], col.tracks)}
              className="w-48 sm:w-[195px] shrink-0 snap-start group cursor-pointer p-4 rounded-2xl bg-[#0e1017] hover:bg-[#12151f] border border-white/[0.06] hover:border-white/20 transition-all flex flex-col justify-between gap-3 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${col.coverGradient} flex items-center justify-center text-white font-medium text-sm group-hover:scale-105 transition-transform shrink-0`}>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {col.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                  {col.name}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {col.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-zinc-400 font-mono">
                <span>{col.tracks.length} streams</span>
                <span className="text-zinc-200 group-hover:text-white font-semibold transition-colors">Play</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          8. YOUR LOCAL MUSIC VAULT (Target: 175–195px Desktop Rail)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
              Your Local Music Vault
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {tracks.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollRail(vaultRailRef, 'left')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollRail(vaultRailRef, 'right')}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <span className="text-xs text-zinc-500 font-mono">{tracks.length} tracks</span>
          </div>
        </div>

        {tracks.length > 0 ? (
          <div 
            ref={vaultRailRef}
            className="flex gap-3 sm:gap-4.5 overflow-x-auto custom-scrollbar snap-x scroll-smooth pb-2"
          >
            {recentlyAdded.map((track) => (
              <div key={track.id} className="w-36 sm:w-[185px] shrink-0 snap-start">
                <SongObjectCard
                  track={track}
                  playlistContext={tracks}
                  variant="grid"
                  onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-[#0e1017] border border-white/[0.06] flex flex-col items-center justify-center text-center gap-3">
            <Music className="w-8 h-8 text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-200">Your local vault is empty</p>
            <p className="text-xs text-zinc-500 max-w-sm">
              Add audio files from your computer, or listen right now to trending open music and global radio stations above.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Import Local Files
              </button>
              <button
                type="button"
                onClick={loadDemoPack}
                className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-xs font-semibold border border-white/[0.08] transition-colors cursor-pointer"
              >
                Load Demo Pack
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Playlist Modal */}
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
