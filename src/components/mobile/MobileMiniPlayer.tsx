import React, { useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Heart, 
  Music,
  SlidersHorizontal
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
    seek,
    setIsExpandedPlayerOpen,
    setIsAudioControlsOpen,
    eqPreset,
    effects,
  } = useMusic();

  const progressRef = useRef<HTMLDivElement>(null);

  const isAudioEffectActive = 
    eqPreset !== 'flat' || 
    Boolean(effects?.reverb?.enabled) || 
    Boolean(effects?.echo?.enabled) || 
    Boolean(effects?.saturation?.enabled) || 
    (effects?.bassBoost ?? 0) > 0 || 
    (effects?.trebleBoost ?? 0) > 0;

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressRef.current || duration <= 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * duration);
  };

  return (
    <div
      id="mobile-mini-player"
      aria-label="Current Track Mini Player"
      className="lg:hidden fixed bottom-14 left-0 right-0 z-30 pb-safe px-2 py-1 select-none"
    >
      <div 
        onClick={() => setIsExpandedPlayerOpen(true)}
        className="relative overflow-hidden rounded-2xl bg-[#12141a]/95 border border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col cursor-pointer active:bg-zinc-900 transition-colors"
      >
        {/* Interactive Scrub Line on top of mini player */}
        <div 
          ref={progressRef}
          onClick={handleProgressBarClick}
          className="relative w-full h-1.5 bg-zinc-800/80 cursor-pointer group"
        >
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-r-full transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Subtle scrubber thumb on hover/touch */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progressPercent}% - 5px)` }}
          />
        </div>

        {/* Mini Player Content Row */}
        <div className="flex items-center justify-between gap-2.5 p-2 sm:px-3">
          
          {/* Artwork & Track Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-sm flex items-center justify-center">
              {currentTrack.coverUrl ? (
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? 'scale-105' : ''}`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${currentTrack.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center text-white`}>
                  <Music className="w-5 h-5 opacity-80" />
                </div>
              )}

              {/* Animated playing indicator */}
              {isPlaying && (
                <div className="absolute inset-0 bg-indigo-950/30 flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 h-full bg-white animate-pulse" />
                    <span className="w-0.5 h-2/3 bg-white animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-0.5 h-4/5 bg-white animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate leading-tight">
                {currentTrack.title}
              </h4>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Quick Action Touch Targets (All >= 44x44px) */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            
            {/* DSP Badge / Audio Controls Trigger */}
            <button
              type="button"
              onClick={() => setIsAudioControlsOpen(true)}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                isAudioEffectActive
                  ? 'text-indigo-400 bg-indigo-500/15'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Open Audio Studio"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Favorite Heart */}
            <button
              type="button"
              onClick={() => toggleFavorite(currentTrack.id)}
              className="p-2.5 rounded-xl text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Favorite"
            >
              <Heart className={`w-4 h-4 transition-transform active:scale-125 ${
                currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`} />
            </button>

            {/* Main Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              type="button"
              onClick={nextTrack}
              className="p-2.5 rounded-xl text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};
