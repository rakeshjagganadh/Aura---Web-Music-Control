import React from 'react';
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
  Flame
} from 'lucide-react';
import { AudioVisualizer } from '../visualizer/AudioVisualizer';
import { AddToPlaylistModal } from '../playlists/AddToPlaylistModal';
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

  const [playlistModalTrack, setPlaylistModalTrack] = React.useState<Track | null>(null);

  const recentlyAdded = [...tracks].sort((a, b) => b.dateAdded - a.dateAdded).slice(0, 8);
  const continueListening = history.slice(0, 4);

  return (
    <div className="flex flex-col gap-10 p-4 sm:p-8 max-w-7xl mx-auto select-none">
      
      {/* -------------------------------------------------------------
          1. LIVING HERO ATMOSPHERE STAGE
          ------------------------------------------------------------- */}
      <section 
        id="home-hero-section"
        className="relative overflow-hidden rounded-3xl bg-[#0b0d13]/70 border border-white/[0.08] p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-2xl backdrop-blur-2xl transition-all duration-700"
      >
        <div className="flex flex-col gap-3.5 max-w-xl z-10">
          <div className="flex items-center gap-2.5">
            <AuraBrandMark size={22} isPlaying={isPlaying} />
            <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
              AURA MUSIC ENVIRONMENT
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              DSP 2.4 ACTIVE
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1] font-sans">
            Sound, shaped <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-200 to-cyan-300">
              by your aura.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-lg">
            A minimal, professional music environment and acoustic control studio. High-fidelity playback with 10-band parametric EQ, 3D binaural spatial acoustics, and real-time spectrum analysis.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Audio
            </button>

            <button
              onClick={() => setIsPlaylistModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            >
              <ListPlus className="w-4 h-4 text-zinc-400" />
              New Space
            </button>

            {tracks.length === 0 && (
              <button
                onClick={loadDemoPack}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Load Synthesized Pack
              </button>
            )}
          </div>
        </div>

        {/* Real-time Spectrum Monitor & Acoustic State */}
        <div className="w-full lg:w-88 p-4.5 rounded-2xl bg-[#0f1118]/80 border border-white/[0.08] backdrop-blur-2xl flex flex-col gap-3.5 shadow-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Real-Time Spectrum</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-zinc-600'}`} />
              <span className="text-[10px] font-mono text-zinc-400 font-medium">
                {isPlaying ? 'STREAMING' : 'IDLE'}
              </span>
            </div>
          </div>

          {/* Visualizer Canvas */}
          <div className="rounded-xl overflow-hidden bg-black/40 border border-white/5 p-1">
            <AudioVisualizer
              height={100}
              mode="spectrum"
              showControls={false}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-white/5 font-mono">
            <span className="text-[10px] text-zinc-500">EQ: {eqPreset.toUpperCase()}</span>
            <button
              onClick={() => setCurrentView('studio')}
              className="text-indigo-400 hover:text-indigo-300 font-sans font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              Open Studio <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Ambient Subtle Aura Light Field */}
        <div className="absolute -right-16 -bottom-16 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
      </section>

      {/* -------------------------------------------------------------
          2. CONTINUE LISTENING (Music Objects Grid)
          ------------------------------------------------------------- */}
      {continueListening.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">
                Continue Listening
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {continueListening.map((track) => (
              <SongObjectCard
                key={`continue-${track.id}`}
                track={track}
                playlistContext={history}
                variant="grid"
                onOpenPlaylistModal={setPlaylistModalTrack}
              />
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------
          3. RECENTLY ADDED MUSIC OBJECTS
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">
              Recently Added
            </h2>
          </div>
          {tracks.length > 0 && (
            <button
              onClick={() => setCurrentView('songs')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              View all ({tracks.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {tracks.length === 0 ? (
          <AuraEmptyState
            title="Your space is quiet."
            description="Add your audio files or explore our synthesized studio demo collection to experience sound with an aura."
            actionLabel="Upload Audio"
            onAction={() => setIsUploadModalOpen(true)}
            secondaryActionLabel="Load Demo Collection"
            onSecondaryAction={loadDemoPack}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5 sm:gap-6">
            {recentlyAdded.map((track) => (
              <SongObjectCard
                key={track.id}
                track={track}
                playlistContext={tracks}
                variant="grid"
                onOpenPlaylistModal={setPlaylistModalTrack}
              />
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------------
          4. CURATED SPACES & PLAYLISTS
          ------------------------------------------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">
              Acoustic Spaces & Playlists
            </h2>
          </div>
          <button
            onClick={() => setIsPlaylistModalOpen(true)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            + New Space
          </button>
        </div>

        {playlists.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#0b0d13]/50 border border-dashed border-white/10 text-center flex flex-col items-center justify-center">
            <p className="text-xs font-semibold text-zinc-300">Nothing arranged yet.</p>
            <p className="text-[11px] text-zinc-500 mt-0.5 mb-4">Create your first acoustic space to group your sounds</p>
            <button
              onClick={() => setIsPlaylistModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            >
              + Create Space
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  setSelectedPlaylistId(pl.id);
                  setCurrentView('playlist-detail');
                }}
                className="group cursor-pointer flex flex-col gap-2.5 p-3 rounded-2xl bg-[#0b0d13]/60 hover:bg-[#12151f] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02]"
              >
                {/* Visual Cover Object */}
                <div className={`relative w-full aspect-square rounded-xl bg-gradient-to-br ${pl.coverGradient} shadow-md flex items-center justify-center text-white overflow-hidden`}>
                  {/* Decorative Geometric Overlay for AURA Signature style */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_70%)]" />
                  <span className="font-bold text-2xl tracking-tighter opacity-90 group-hover:scale-110 transition-transform duration-300">
                    {pl.title.charAt(0)}
                  </span>
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-md text-[9px] font-mono text-zinc-300">
                    {pl.trackIds.length} {pl.trackIds.length === 1 ? 'track' : 'tracks'}
                  </div>
                </div>

                <div className="px-0.5">
                  <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                    {pl.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {pl.description || 'Custom playlist space'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Playlist Modal */}
      <AddToPlaylistModal
        track={playlistModalTrack}
        isOpen={!!playlistModalTrack}
        onClose={() => setPlaylistModalTrack(null)}
      />

    </div>
  );
};
