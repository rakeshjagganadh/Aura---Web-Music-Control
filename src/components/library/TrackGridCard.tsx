import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Track } from '../../types';
import { useMusic } from '../../context/MusicContext';
import { MotionPopover } from '../common/motion/MotionSurface';
import { MotionIconSwap } from '../common/motion/MotionInteractive';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';
import { MOTION_TRANSITION } from '../../motion/tokens';
import { 
  Play, 
  Pause, 
  Heart, 
  MoreHorizontal, 
  ListPlus, 
  ListMusic, 
  Trash2, 
  Music,
  Info 
} from 'lucide-react';

interface TrackGridCardProps {
  track: Track;
  playlistContext?: Track[];
  onOpenPlaylistModal?: (track: Track) => void;
  onRemove?: (trackId: string) => void;
  className?: string;
}

export const TrackGridCard: React.FC<TrackGridCardProps> = ({
  track,
  playlistContext,
  onOpenPlaylistModal,
  onRemove,
  className = '',
}) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    toggleFavorite,
    addToQueue,
    playNext,
    deleteTrack,
    openTrackInfo,
  } = useMusic();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { canHover, prefersReducedMotion } = useMotionCapabilities();

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const isCurrent = currentTrack?.id === track.id;
  const isActivelyPlaying = isCurrent && isPlaying;

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, playlistContext);
    }
  };

  const formatDuration = (secs?: number) => {
    if (!secs || isNaN(secs) || secs <= 0) return '';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      id={`track-card-${track.id}`}
      onClick={handleCardClick}
      onMouseLeave={() => setIsMenuOpen(false)}
      className={`group relative flex flex-col p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] aura-pressable-subtle transition-[background-color,border-color,box-shadow] duration-200 cursor-pointer select-none shadow-sm hover:shadow-md ${
        isCurrent ? 'bg-white/[0.10] border-sky-400/50 shadow-md' : ''
      } ${className}`}
    >
      {/* Artwork Tile (Aspect Square) */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shadow-sm mb-3">
        {track.coverUrl && !imageError ? (
          <img
            src={track.coverUrl}
            alt={track.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${canHover ? 'group-hover:scale-105' : ''}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-950 to-zinc-900'} flex items-center justify-center`}>
            <Music className="w-8 h-8 text-white/40" />
          </div>
        )}

        {/* Floating Play Button */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
          isCurrent || isActivelyPlaying
            ? 'opacity-100'
            : !canHover
              ? 'opacity-90'
              : 'opacity-0 group-hover:opacity-100'
        }`}>
          <div className={`w-11 h-11 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl transition-transform ${canHover ? 'group-hover:scale-105' : ''} active:scale-95`}>
            <MotionIconSwap stateKey={isActivelyPlaying ? 'pause' : 'play'}>
              {isActivelyPlaying ? (
                <Pause className="w-4 h-4 fill-current text-black" />
              ) : (
                <Play className="w-4 h-4 fill-current text-black translate-x-0.5" />
              )}
            </MotionIconSwap>
          </div>
        </div>

        {/* Top-Right Favorite Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(track.id);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center aura-pressable aura-focus-ring transition-opacity cursor-pointer ${
            track.isFavorite
              ? 'opacity-100 text-rose-400'
              : !canHover
                ? 'opacity-100 text-white/80'
                : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100 text-white/80 hover:text-white'
          }`}
          title={track.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <motion.span
            className="inline-flex items-center justify-center"
            animate={!prefersReducedMotion && track.isFavorite ? { scale: [1, 1.24, 1] } : { scale: 1 }}
            transition={MOTION_TRANSITION.micro}
          >
            <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </motion.span>
        </button>

        {/* Duration watermark */}
        {track.duration > 0 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-zinc-300 tabular-nums">
            {formatDuration(track.duration)}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <h4 className={`text-xs sm:text-sm font-semibold truncate leading-tight font-ui-title ${
            isCurrent ? 'text-sky-300' : 'text-zinc-100 group-hover:text-white'
          }`}>
            {track.title}
          </h4>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-ui-meta">
            {track.artist || 'Unknown Artist'}
          </p>
        </div>

        {/* Context Menu Trigger */}
        <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] aura-pressable aura-focus-ring transition-colors cursor-pointer"
            title="Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <MotionPopover
                placement="top"
                style={{ pointerEvents: 'auto' }}
                className="absolute right-0 bottom-full mb-1 w-44 rounded-2xl aura-glass-island shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 border border-white/10 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    playNext(track);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-left aura-pressable cursor-pointer"
                >
                  <ListMusic className="w-3.5 h-3.5 text-sky-400" />
                  <span>Play Next</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToQueue(track);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-left aura-pressable cursor-pointer"
                >
                  <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Add to Queue</span>
                </button>
                {onOpenPlaylistModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPlaylistModal(track);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-left aura-pressable cursor-pointer"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add to Playlist...</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    openTrackInfo(track);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-left aura-pressable cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Details</span>
                </button>
                {onRemove ? (
                  <button
                    type="button"
                    onClick={() => {
                      onRemove(track.id);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl text-left aura-pressable cursor-pointer border-t border-white/[0.06] mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                ) : (!track.source || track.source === 'local') ? (
                  <button
                    type="button"
                    onClick={() => {
                      deleteTrack(track.id);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl text-left aura-pressable cursor-pointer border-t border-white/[0.06] mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : null}
              </MotionPopover>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
