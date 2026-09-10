import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { AuraBrandMark } from '../common/AuraBrandMark';
import { AuraEmptyState } from '../common/AuraEmptyState';
import { SongObjectCard } from '../common/SongObjectCard';
import { 
  Play, 
  UploadCloud, 
  Sparkles, 
  ListPlus, 
  Disc, 
  Clock, 
  ChevronRight, 
  Activity,
  Layers,
  SlidersHorizontal,
  Search,
  Radio,
  HardDrive,
  Compass,
  ArrowUpRight,
  Music,
  Plus
} from 'lucide-react';
import { AudioVisualizer } from '../visualizer/AudioVisualizer';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
import { UniversalSearchModal } from '../search/UniversalSearchModal';
import { CURATED_DISCOVERY_TRACKS, CURATED_COLLECTIONS } from '../../services/discoveryService';
import { Track } from '../../types';

export const HomeView: React.FC = () => {
  const {
    tracks,
    playlists,
    currentTrack,
    isPlaying,
    setIsUploadModalOpen,
    setIsPlaylistModalOpen,
    loadDemoPack,
    setCurrentView,
    setSelectedPlaylistId,
    history,
    eqPreset,
    togglePlay,
    playTrack,
  } = useMusic();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);

  const recentlyAdded = [...tracks].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, 8);
  const continueListening = history.slice(0, 4);

  return (
    <div className="flex flex-col gap-10 p-4 sm:p-8 max-w-7xl mx-auto select-none">
      
      {/* -------------------------------------------------------------
          1. UNIVERSAL DISCOVERY & LISTENING SEARCH GATEWAY
          ------------------------------------------------------------- */}
      <section 
        id="home-hero-section"
        className="relative overflow-hidden rounded-3xl bg-[#0b0d14]/80 border border-white/[0.08] p-6 sm:p-10 flex flex-col gap-6 shadow-2xl backdrop-blur-2xl transition-all duration-700"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 z-10">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <AuraBrandMark size={22} isPlaying={isPlaying} />
              <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
                UNIVERSAL MUSIC ENVIRONMENT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                DSP ACTIVE
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Where will your sound take you today?
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Listen seamlessly across your local library, curated ambient streams, and web audio with studio acoustic control.
            </p>
          </div>

          {/* Quick Real-Time Mini Spectrum */}
          <div className="w-full lg:w-72 p-3.5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-indigo-400" />
                Live Spectrum
              </span>
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            </div>
            <div className="rounded-xl overflow-hidden bg-black/50 p-1">
              <AudioVisualizer height={55} mode="spectrum" showControls={false} />
            </div>
          </div>
        </div>

        {/* Big Search Bar Trigger */}
        <div 
          onClick={() => setIsSearchModalOpen(true)}
          className="group cursor-pointer flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-zinc-950/80 hover:bg-zinc-900/90 border border-white/10 hover:border-indigo-500/40 transition-all shadow-inner z-10"
        >
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm text-zinc-400 group-hover:text-zinc-200">
              Search any song, artist, space, or paste an audio stream / YouTube link...
            </span>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-zinc-900 text-[10px] font-mono text-zinc-500 border border-white/5">
              ⌘K
            </kbd>
            <span className="px-3 py-1 rounded-xl bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              Explore
            </span>
          </div>
        </div>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap items-center gap-2 z-10 text-xs">
          <span className="text-[11px] font-mono text-zinc-500 mr-1">Quick Play:</span>
          {CURATED_DISCOVERY_TRACKS.slice(0, 3).map((stream) => (
            <button
              key={stream.id}
              onClick={() => playTrack(stream, CURATED_DISCOVERY_TRACKS)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-indigo-600/20 text-zinc-300 hover:text-indigo-200 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{stream.title.split('(')[0]}</span>
            </button>
          ))}

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors ml-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Music</span>
          </button>
        </div>

      </section>

      {/* -------------------------------------------------------------
          2. THREE GATEWAYS: CURATED CATALOG, SOURCES, AUDIO STUDIO
          ------------------------------------------------------------- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Curated Open Streams */}
        <div 
          onClick={() => playTrack(CURATED_DISCOVERY_TRACKS[0], CURATED_DISCOVERY_TRACKS)}
          className="group cursor-pointer p-5 rounded-3xl bg-[#0c0e15]/60 hover:bg-[#0f121b] border border-white/5 hover:border-indigo-500/30 backdrop-blur-xl transition-all flex flex-col justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              OPEN CATALOG
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors">
              Curated Soundscapes
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Lossless ambient drones, cyber synthwave, and lo-fi focus beats ready to stream.
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Listen Now</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Music Sources */}
        <div 
          onClick={() => setCurrentView('sources')}
          className="group cursor-pointer p-5 rounded-3xl bg-[#0c0e15]/60 hover:bg-[#0f121b] border border-white/5 hover:border-indigo-500/30 backdrop-blur-xl transition-all flex flex-col justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              CONNECTED
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
              Music Sources & Streams
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Local library files, internet radio streams, and official YouTube player connections.
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
            <span>Manage Sources</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Personal Audio Studio */}
        <div 
          onClick={() => setCurrentView('studio')}
          className="group cursor-pointer p-5 rounded-3xl bg-[#0c0e15]/60 hover:bg-[#0f121b] border border-white/5 hover:border-indigo-500/30 backdrop-blur-xl transition-all flex flex-col justify-between gap-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 group-hover:scale-105 transition-transform">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20">
              SOUND LAB
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white group-hover:text-fuchsia-200 transition-colors">
              Acoustic Studio & DSP
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              10-Band EQ, 3D Binaural Spatializer, Phase telemetry, and Loop A/B studio.
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-fuchsia-400 group-hover:translate-x-1 transition-transform">
            <span>Open Audio Studio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </section>

      {/* -------------------------------------------------------------
          3. DISCOVER SONIC WORLDS (Curated Collections)
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              Discover Sonic Worlds
            </h2>
          </div>
          <span className="text-xs text-zinc-500">Royalty-Free Open Audio</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CURATED_COLLECTIONS.map((col) => (
            <div
              key={col.id}
              onClick={() => playTrack(col.tracks[0], col.tracks)}
              className="group cursor-pointer p-5 rounded-3xl bg-[#0c0e15] hover:bg-[#10131d] border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between gap-4 shadow-lg relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${col.coverGradient} opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity`} />
              
              <div className="flex items-start justify-between z-10">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${col.coverGradient} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                  <Play className="w-4 h-4 fill-white" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {col.tags.slice(0, 2).map((t) => (
                    <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-zinc-400 border border-white/5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="z-10">
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                  {col.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {col.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 z-10 text-[11px] text-zinc-400">
                <span>{col.tracks.length} tracks</span>
                <span className="text-indigo-400 group-hover:underline">Play Stream</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          4. CONTINUE LISTENING (History)
          ------------------------------------------------------------- */}
      {continueListening.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Continue Listening
              </h2>
            </div>
            <button
              onClick={() => setCurrentView('library')}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              View Full Library <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {continueListening.map((track) => (
              <SongObjectCard
                key={`hist-${track.id}`}
                track={track}
                playlistContext={history}
                variant="grid"
                onOpenPlaylistModal={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          5. YOUR LIBRARY TRACKS
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              Your Library & Stored Music
            </h2>
          </div>
          <span className="text-xs text-zinc-500">{tracks.length} tracks</span>
        </div>

        {tracks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
          <div className="p-8 rounded-3xl bg-[#0c0e15]/50 border border-white/5 flex flex-col items-center justify-center text-center gap-3">
            <Music className="w-8 h-8 text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-300">Your local library is waiting</p>
            <p className="text-xs text-zinc-500 max-w-sm">
              Add audio files from your computer, or listen right now to the Curated Open Soundscapes above.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                Import Local Files
              </button>
              <button
                onClick={loadDemoPack}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-white/10 transition-colors"
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
