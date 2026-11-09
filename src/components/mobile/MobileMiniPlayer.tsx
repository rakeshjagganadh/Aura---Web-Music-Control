import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { useListenTogether } from '../../context/ListenTogetherContext';
import { TelemetryBadge } from '../common/primitives/TelemetryBadge';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Heart, 
  Music,
} from 'lucide-react';

export const MobileMiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    toggleFavorite,
    setIsExpandedPlayerOpen,
    currentView,
  } = useMusic();

  const listenTogether = useListenTogether();
  const isInRoom = Boolean(listenTogether?.activeRoom);
  const isLocallySilenced = listenTogether?.isLocallySilenced ?? false;

  // Crucial: When on the Listen Together view, hide the mini player to prevent duplicate stacked players
  if (!currentTrack || currentView === 'listen-together') return null;

  const isRadio = currentTrack.source === 'radio';
  const isUnknownDuration = !isRadio && (isNaN(duration) || duration <= 0);
  const showProgress = !isRadio && !isUnknownDuration && duration > 0;
  const progressPercent = showProgress ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div
      id="mobile-mini-player"
      aria-label="Current Track Mini Player"
      className="lg:hidden fixed bottom-[calc(58px+env(safe-area-inset-bottom,0px)+10px)] left-3 right-3 z-30 select-none animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div 
        onClick={() => setIsExpandedPlayerOpen(true)}
        className="relative overflow-hidden rounded-2xl aura-glass-island p-2.5 flex flex-col justify-between cursor-pointer active:scale-[0.99] transition-all"
      >
        {/* COMPACT ROW — TRACK & CONTROLS */}
        <div className="flex items-center justify-between gap-2.5">
          
          {/* Track Artwork & Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-[#0d1017] border border-white/10 shadow-sm flex items-center justify-center">
              {currentTrack.coverUrl ? (
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? 'scale-105' : ''}`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${currentTrack.coverColor || 'from-[#141a29] to-[#080b12]'} flex items-center justify-center text-white`}>
                  <Music className="w-4 h-4 opacity-70" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h4 className="text-xs font-track-title text-white truncate leading-tight">
                  {currentTrack.title}
                </h4>
                {currentTrack.source && (
                  <span className="text-[9px] font-mono text-zinc-500 uppercase shrink-0">
                    · {currentTrack.source}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-artist-name text-zinc-400 truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Touch Target Actions */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            
            {/* Favorite Heart Button */}
            <button
              type="button"
              onClick={() => toggleFavorite(currentTrack.id)}
              aria-label={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className="p-2 rounded-xl text-zinc-300 hover:text-rose-400 active:scale-110 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <Heart className={`w-4 h-4 ${
                currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`} />
            </button>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={isInRoom && listenTogether ? listenTogether.roomTogglePlay : togglePlay}
              aria-label={isPlaying && !isLocallySilenced ? 'Pause' : 'Play'}
              className="w-9 h-9 rounded-full text-zinc-950 bg-white hover:bg-zinc-200 flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 shrink-0"
            >
              {isPlaying && !isLocallySilenced ? (
                <Pause className="w-4 h-4 fill-current text-black" />
              ) : (
                <Play className="w-4 h-4 fill-current text-black translate-x-0.5" />
              )}
            </button>

            {/* Next Track Button */}
            <button
              type="button"
              onClick={isInRoom && listenTogether ? listenTogether.roomNext : nextTrack}
              aria-label="Next Track"
              className="p-2 rounded-xl text-zinc-300 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

          </div>

        </div>

        {/* PASSIVE BOTTOM PROGRESS INDICATOR (EMBEDDED AT BOTTOM OF GLASS SURFACE) */}
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/[0.08] pointer-events-none overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 via-indigo-300 to-white rounded-r-full transition-all duration-200 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.4)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

      </div>
    </div>
  );
};
