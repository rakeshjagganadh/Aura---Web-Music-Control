import React, { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { AuraBrandMark } from '../common/AuraBrandMark';
import { SongObjectCard } from '../common/SongObjectCard';
import { 
  Play, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  Activity,
  SlidersHorizontal,
  Search,
  Radio,
  HardDrive,
  Compass,
  Music,
  Plus,
  Heart,
  Globe,
  Flame
} from 'lucide-react';
import { AudioVisualizer } from '../visualizer/AudioVisualizer';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { UniversalSearchModal } from '../search/UniversalSearchModal';
import { CURATED_DISCOVERY_TRACKS, CURATED_COLLECTIONS } from '../../services/discoveryService';
import { jamendoProvider } from '../../services/providers/jamendoProvider';
import { audiusService } from '../../services/audiusService';
import { radioBrowserProvider } from '../../services/providers/radioBrowserProvider';
import { unifiedTrackToAuraTrack, radioStationToAuraTrack } from '../../services/providers/types';
import { Track } from '../../types';

export const HomeView: React.FC = () => {
  const {
    tracks,
    playlists,
    currentTrack,
    isPlaying,
    setIsUploadModalOpen,
    loadDemoPack,
    setCurrentView,
    history,
    recentlyPlayed,
    favoriteItems,
    playTrack,
    toggleFavorite,
    isFavorite,
  } = useMusic();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);

  // Dynamic Discovery States
  const [jamendoTrending, setJamendoTrending] = useState<Track[]>([]);
  const [audiusTrending, setAudiusTrending] = useState<Track[]>([]);
  const [topRadioStations, setTopRadioStations] = useState<Track[]>([]);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDiscoveries() {
      setIsLoadingDiscovery(true);
      try {
        const [jamRes, audRes, radioRes] = await Promise.allSettled([
          jamendoProvider.getTrending({ limit: 6 }),
          audiusService.getTrending(6),
          radioBrowserProvider.getTopVotedStations(6),
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

  const recentlyAdded = [...tracks].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, 8);
  const continueListening = (recentlyPlayed && recentlyPlayed.length > 0
    ? recentlyPlayed.map((rp) => rp.track)
    : history
  ).slice(0, 6);

  // Favorited tracks converted to list
  const favoritedTracks = favoriteItems.slice(0, 6).map((f) => f.track);

  return (
    <div className="flex flex-col gap-10 p-4 sm:p-8 max-w-7xl mx-auto select-none">
      
      {/* -------------------------------------------------------------
          1. UNIVERSAL DISCOVERY & LISTENING SEARCH GATEWAY
          ------------------------------------------------------------- */}
      <section 
        id="home-hero-section"
        className="relative overflow-hidden rounded-2xl bg-[#0e1017] border border-white/[0.06] p-6 sm:p-8 flex flex-col gap-6 shadow-xl"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 z-10">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2">
              <AuraBrandMark size={20} isPlaying={isPlaying} />
              <span className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                AURA STUDIO ENVIRONMENT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                UNIVERSAL DSP
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
              Acoustic Precision. Pure Universal Listening.
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Listen seamlessly across local IndexedDB music, Jamendo Creative Commons, Audius Web3, Radio Browser continuous streams, and YouTube with studio acoustic DSP.
            </p>
          </div>

          {/* Quick Real-Time Mini Spectrum */}
          <div className="w-full lg:w-72 p-3.5 rounded-xl bg-[#12141c] border border-white/[0.06] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-zinc-400" />
                Live Spectrum
              </span>
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            </div>
            <div className="rounded-lg overflow-hidden bg-black/40 p-1">
              <AudioVisualizer height={50} mode="spectrum" showControls={false} />
            </div>
          </div>
        </div>

        {/* Big Search Bar Trigger */}
        <div 
          onClick={() => setIsSearchModalOpen(true)}
          className="group cursor-pointer flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-[#131620] hover:bg-[#161a26] border border-white/[0.08] hover:border-white/20 transition-all z-10"
        >
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
            <span className="text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-200">
              Search any track across Local, Jamendo, Audius, YouTube & Radio Browser...
            </span>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-zinc-400 border border-white/[0.08]">
              ⌘K
            </kbd>
            <span className="px-3 py-1 rounded-lg bg-white text-zinc-950 text-xs font-semibold group-hover:bg-zinc-200 transition-all shadow-sm">
              Universal Search
            </span>
          </div>
        </div>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap items-center gap-2 z-10 text-xs">
          <span className="text-[11px] font-mono text-zinc-500 mr-1">Quick Stream:</span>
          {CURATED_DISCOVERY_TRACKS.slice(0, 3).map((stream) => (
            <button
              key={stream.id}
              onClick={() => playTrack(stream, CURATED_DISCOVERY_TRACKS)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] hover:border-white/15 transition-all cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{stream.title.split('(')[0]}</span>
            </button>
          ))}

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/10 transition-colors ml-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Music</span>
          </button>
        </div>

      </section>

      {/* -------------------------------------------------------------
          2. MULTI-SOURCE AUDIO ENGINE CHANNELS
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h2 className="font-mono uppercase tracking-widest text-zinc-300 font-semibold text-[11px]">
              Multi-Source Audio Engine
            </h2>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            BACKGROUND PLAY ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div 
            onClick={() => setIsSearchModalOpen(true)}
            className="p-3.5 rounded-xl bg-[#0e1017] hover:bg-[#131622] border border-white/[0.06] hover:border-red-500/40 transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-semibold">
                YOUTUBE
              </span>
              <span className="text-[10px] font-mono text-zinc-500">IFRAME API</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white group-hover:text-red-300 transition-colors">Audio Player Bridge</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Background audio keep-alive</p>
            </div>
          </div>

          <div 
            onClick={() => setCurrentView('sources')}
            className="p-3.5 rounded-xl bg-[#0e1017] hover:bg-[#131622] border border-white/[0.06] hover:border-emerald-500/40 transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                JAMENDO
              </span>
              <span className="text-[10px] font-mono text-zinc-500">MP3 320K</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">Creative Commons</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Direct open streaming</p>
            </div>
          </div>

          <div 
            onClick={() => setCurrentView('sources')}
            className="p-3.5 rounded-xl bg-[#0e1017] hover:bg-[#131622] border border-white/[0.06] hover:border-purple-500/40 transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold">
                AUDIUS
              </span>
              <span className="text-[10px] font-mono text-zinc-500">DECENTRALIZED</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">Web3 Music Catalog</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Independent artist streams</p>
            </div>
          </div>

          <div 
            onClick={() => setCurrentView('sources')}
            className="p-3.5 rounded-xl bg-[#0e1017] hover:bg-[#131622] border border-white/[0.06] hover:border-amber-500/40 transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                RADIO BROWSER
              </span>
              <span className="text-[10px] font-mono text-zinc-500">LIVE STREAMS</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">Global Internet Radio</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">50,000+ continuous stations</p>
            </div>
          </div>

          <div 
            onClick={() => setCurrentView('library')}
            className="p-3.5 rounded-xl bg-[#0e1017] hover:bg-[#131622] border border-white/[0.06] hover:border-indigo-500/40 transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-semibold">
                LOCAL DISK
              </span>
              <span className="text-[10px] font-mono text-zinc-500">{tracks.length} FILES</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">Private Vault</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">100% offline IndexedDB</p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          3. CONTINUE LISTENING (Recently Played Persistent History)
          ------------------------------------------------------------- */}
      {continueListening.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
                Recently Played Across All Sources
              </h2>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">Persistent Listening Log</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {continueListening.map((track) => (
              <SongObjectCard
                key={`hist-${track.id}`}
                track={track}
                playlistContext={continueListening}
                variant="grid"
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          4. FAVORITES QUICK ROW
          ------------------------------------------------------------- */}
      {favoritedTracks.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400 fill-current" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
                Your Favorites Quick Row
              </h2>
            </div>
            <button
              onClick={() => setCurrentView('favorites')}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
            >
              View All Favorites <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {favoritedTracks.map((track) => (
              <SongObjectCard
                key={`fav-${track.id}`}
                track={track}
                playlistContext={favoritedTracks}
                variant="grid"
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          5. JAMENDO CREATIVE COMMONS TRENDING
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
              Jamendo Creative Commons Trending
            </h2>
          </div>
          <button
            onClick={() => setCurrentView('sources')}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
          >
            Explore Jamendo Provider <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {jamendoTrending.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {jamendoTrending.map((track) => (
              <SongObjectCard
                key={track.id}
                track={track}
                playlistContext={jamendoTrending}
                variant="grid"
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#0e1017] border border-white/[0.06] text-center text-xs text-zinc-500 font-mono">
            {isLoadingDiscovery ? 'Loading Jamendo Creative Commons trending tracks...' : 'Jamendo trending tracks currently unavailable.'}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          6. AUDIUS DECENTRALIZED TRENDING
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
              Audius Decentralized Discoveries
            </h2>
          </div>
          <button
            onClick={() => setCurrentView('sources')}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
          >
            Explore Audius Provider <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {audiusTrending.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {audiusTrending.map((track) => (
              <SongObjectCard
                key={track.id}
                track={track}
                playlistContext={audiusTrending}
                variant="grid"
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#0e1017] border border-white/[0.06] text-center text-xs text-zinc-500 font-mono">
            {isLoadingDiscovery ? 'Connecting to Audius decentralized nodes...' : 'Audius discoveries currently unavailable.'}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          7. TOP GLOBAL INTERNET RADIO STATIONS
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-semibold">
              Top Global Internet Radio
            </h2>
          </div>
          <button
            onClick={() => setCurrentView('sources')}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer font-mono"
          >
            Manage Internet Radio <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topRadioStations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topRadioStations.map((stationTrack) => (
              <SongObjectCard
                key={stationTrack.id}
                track={stationTrack}
                playlistContext={topRadioStations}
                variant="grid"
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#0e1017] border border-white/[0.06] text-center text-xs text-zinc-500 font-mono">
            {isLoadingDiscovery ? 'Querying Radio Browser global directory...' : 'Internet radio stations currently unavailable.'}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          8. DISCOVER SONIC WORLDS (Curated Soundscapes)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
              Curated Soundscapes
            </h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">Open Ambient Streams</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CURATED_COLLECTIONS.map((col) => (
            <div
              key={col.id}
              onClick={() => playTrack(col.tracks[0], col.tracks)}
              className="group cursor-pointer p-5 rounded-xl bg-[#0e1017] hover:bg-[#12151f] border border-white/[0.06] hover:border-white/20 transition-all flex flex-col justify-between gap-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white font-medium text-sm group-hover:bg-white group-hover:text-zinc-950 transition-colors">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {col.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-zinc-100 transition-colors">
                  {col.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                  {col.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-zinc-400">
                <span className="font-mono">{col.tracks.length} tracks</span>
                <span className="text-zinc-300 group-hover:text-white font-medium transition-colors">Play Stream</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          9. YOUR LOCAL LIBRARY FILES
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-zinc-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
              Library & Stored Music
            </h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">{tracks.length} tracks</span>
        </div>

        {tracks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {recentlyAdded.map((track) => (
              <SongObjectCard
                key={track.id}
                track={track}
                playlistContext={tracks}
                variant="grid"
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-[#0e1017] border border-white/[0.06] flex flex-col items-center justify-center text-center gap-3">
            <Music className="w-8 h-8 text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-200">Your local library is waiting</p>
            <p className="text-xs text-zinc-500 max-w-sm">
              Add audio files from your computer, or listen right now to Jamendo, Audius, or Radio Browser open soundscapes above.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Import Local Files
              </button>
              <button
                onClick={loadDemoPack}
                className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-xs font-semibold border border-white/[0.08] transition-colors cursor-pointer"
              >
                Load Demo Pack
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Universal Search Modal */}
      <UniversalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

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
