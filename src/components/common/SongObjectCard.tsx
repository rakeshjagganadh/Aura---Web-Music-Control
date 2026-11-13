import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Track } from '../../types';
import { useMusic } from '../../context/MusicContext';
import { useListenTogether } from '../../context/ListenTogetherContext';
import { MotionPopover } from './motion/MotionSurface';
import { MotionIconSwap } from './motion/MotionInteractive';
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
  Disc,
  Clock,
  Sparkles,
  Info,
  Users
} from 'lucide-react';

interface SongObjectCardProps {
  track: Track;
  playlistContext?: Track[];
  variant?: 'grid' | 'row' | 'compact' | 'hero-card';
  showIndex?: number;
  onOpenPlaylistModal?: (track: Track) => void;
  className?: string;
}

export const SongObjectCard: React.FC<SongObjectCardProps> = ({
  track,
  playlistContext,
  variant = 'grid',
  showIndex,
  onOpenPlaylistModal,
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
    setCurrentView,
  } = useMusic();

  const {
    isInRoom,
    roomAddTrack,
    createRoom,
  } = useListenTogether();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { canHover, prefersReducedMotion } = useMotionCapabilities();

  const isCurrent = currentTrack?.id === track.id;
  const isActivelyPlaying = isCurrent && isPlaying;

  const handleCardClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, playlistContext);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // -------------------------------------------------------------
  // VARIANT: GRID (The Primary Signature AURA "Music Object")
  // -------------------------------------------------------------
  if (variant === 'grid' || variant === 'hero-card') {
    return (
      <div
        id={`song-object-${track.id}`}
        onMouseEnter={() => { if (canHover) setIsHovered(true); }}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsMenuOpen(false);
        }}
        className={`group relative flex flex-col cursor-pointer transition-colors duration-200 select-none ${className}`}
      >
        {/* Artwork Container as the Core Physical/Digital Music Object */}
        <div
          onClick={handleCardClick}
          className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-[#0c0f17] border border-white/[0.18] transition-[border-color,box-shadow,transform] duration-300 ease-out aura-pressable-subtle ${
            isCurrent
              ? 'ring-2 ring-white/50 shadow-2xl'
              : `shadow-lg ${canHover ? 'group-hover:shadow-2xl group-hover:border-white/40 group-hover:scale-[1.02]' : ''}`
          }`}
        >
          {/* Track Artwork */}
          {track.coverUrl && !imageError ? (
            <img
              src={track.coverUrl}
              alt={track.title}
              className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
                isActivelyPlaying ? 'scale-[1.03]' : canHover ? 'group-hover:scale-[1.04]' : ''
              }`}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-[#141a29] via-[#0d121c] to-[#080b12]'} flex flex-col items-center justify-center p-4 text-white/80`}>
              <Disc className={`w-9 h-9 opacity-35 mb-2 stroke-1 transition-transform duration-500 text-slate-300 ${canHover ? 'group-hover:rotate-12' : ''}`} />
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-40 font-medium truncate max-w-full px-2 text-center">
                {track.artist || track.source || 'AURA'}
              </span>
            </div>
          )}

          {/* Integrated Floating Play / Active Signal Control */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
              isCurrent || isHovered
                ? 'opacity-100 bg-black/40 backdrop-blur-[2px]'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-200 shadow-xl ${
                isActivelyPlaying
                  ? 'bg-white text-zinc-950 scale-100'
                  : `bg-white text-zinc-950 ${canHover ? 'group-hover:scale-110' : ''} active:scale-95`
              }`}
            >
              <MotionIconSwap stateKey={isActivelyPlaying ? 'pause' : 'play'}>
                {isActivelyPlaying ? (
                  <Pause className="w-4 h-4 fill-current text-black" />
                ) : (
                  <Play className="w-4 h-4 fill-current text-black translate-x-0.5" />
                )}
              </MotionIconSwap>
            </div>
          </div>

          {/* Live Frequency Equalizer Animation for Active Track */}
          {isActivelyPlaying && (
            <div className="absolute bottom-2 left-2 flex items-end gap-0.5 px-2 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 shadow-sm pointer-events-none">
              <span className={`w-0.5 h-3 bg-white rounded-full ${!prefersReducedMotion ? 'animate-[pulse_0.6s_ease-in-out_infinite]' : ''}`} />
              <span className={`w-0.5 h-4 bg-zinc-300 rounded-full ${!prefersReducedMotion ? 'animate-[pulse_0.9s_ease-in-out_infinite_0.2s]' : ''}`} />
              <span className={`w-0.5 h-2 bg-zinc-400 rounded-full ${!prefersReducedMotion ? 'animate-[pulse_0.7s_ease-in-out_infinite_0.4s]' : ''}`} />
              <span className={`w-0.5 h-3.5 bg-white rounded-full ${!prefersReducedMotion ? 'animate-[pulse_0.8s_ease-in-out_infinite_0.1s]' : ''}`} />
            </div>
          )}

          {/* Source Attribution Tag (Top Left) */}
          {track.source && (
            <div className="absolute top-2 left-2 pointer-events-none">
              <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10 shadow-sm uppercase tracking-wider">
                {track.source === 'youtube' ? 'YouTube' : track.source === 'radio' ? 'Radio' : track.source.toUpperCase()}
              </span>
            </div>
          )}

          {/* Duration Tag (Top Right) */}
          {track.duration > 0 && (
            <div className={`absolute top-2 right-2 transition-opacity duration-200 pointer-events-none ${!canHover ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10">
                {formatTime(track.duration)}
              </span>
            </div>
          )}
        </div>

        {/* Object Metadata & Subtle Controls */}
        <div className="flex items-start justify-between gap-2 mt-2.5 px-0.5">
          <div className="min-w-0 flex-1" onClick={handleCardClick}>
            <h3
              className={`text-xs sm:text-sm font-medium truncate transition-colors leading-snug ${
                isCurrent
                  ? 'text-white font-semibold'
                  : 'text-zinc-200 group-hover:text-white'
              }`}
              title={track.title}
            >
              {track.title}
            </h3>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5 leading-tight group-hover:text-zinc-300 transition-colors">
              {track.artist}
            </p>
          </div>

          {/* Quick Actions (Favorite + Context Menu) */}
          <div
            className={`flex items-center gap-1 shrink-0 transition-opacity duration-200 ${
              !canHover || isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => toggleFavorite(track.id)}
              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-white/5 aura-pressable aura-focus-ring transition-colors cursor-pointer"
              title={track.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <motion.span
                className="inline-flex items-center justify-center"
                animate={!prefersReducedMotion && track.isFavorite ? { scale: [1, 1.24, 1] } : { scale: 1 }}
                transition={MOTION_TRANSITION.micro}
              >
                <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </motion.span>
            </button>

            {/* Context Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-white/5 aura-pressable aura-focus-ring transition-colors cursor-pointer"
                title="More options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <MotionPopover
                    placement="top"
                    style={{ pointerEvents: 'auto' }}
                    className="absolute right-0 bottom-full mb-1.5 w-44 rounded-xl bg-[#161922] border border-white/[0.08] shadow-2xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        openTrackInfo(track);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left aura-pressable cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-zinc-400" />
                      Track Info & Metadata
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playNext(track);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left aura-pressable cursor-pointer"
                    >
                      <ListMusic className="w-3.5 h-3.5 text-zinc-400" />
                      Play Next
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addToQueue(track);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left aura-pressable cursor-pointer"
                    >
                      <ListPlus className="w-3.5 h-3.5 text-zinc-400" />
                      Add to Queue
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        if (isInRoom) {
                          roomAddTrack(track);
                        } else {
                          createRoom(`${track.title} Session`, track).then(() => {
                            setCurrentView('listen-together');
                          });
                        }
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left aura-pressable cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      {isInRoom ? 'Add to Shared Room' : 'Play in Listen Together'}
                    </button>
                    {onOpenPlaylistModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenPlaylistModal(track);
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left aura-pressable cursor-pointer"
                      >
                        <ListPlus className="w-3.5 h-3.5 text-amber-400" />
                        Add to Playlist...
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        deleteTrack(track.id);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg text-left aura-pressable cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Track
                    </button>
                  </MotionPopover>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VARIANT: ROW (Streamlined Pure Atmospheric Library Row)
  // -------------------------------------------------------------
  return (
    <div
      id={`song-row-${track.id}`}
      onMouseEnter={() => { if (canHover) setIsHovered(true); }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsMenuOpen(false);
      }}
      className={`group relative flex items-center justify-between p-2.5 sm:px-3.5 rounded-xl transition-colors duration-200 cursor-pointer select-none aura-pressable-subtle ${
        isCurrent
          ? 'glass-floating border-sky-400/40 text-white font-medium shadow-[0_4px_20px_rgba(56,189,248,0.2)]'
          : 'hover:glass-ambient text-zinc-300 hover:text-white border border-transparent hover:border-white/15'
      } ${className}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {showIndex !== undefined && (
          <span className="text-xs font-mono text-zinc-500 w-5 shrink-0 text-center">
            {isActivelyPlaying ? (
              <span className={`inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 ${!prefersReducedMotion ? 'animate-pulse' : ''}`} />
            ) : (
              showIndex
            )}
          </span>
        )}

        {/* Thumbnail Object */}
        <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-[#0e1017] border border-white/15 shadow-sm">
          {track.coverUrl && !imageError ? (
            <img
              src={track.coverUrl}
              alt={track.title}
              className={`w-full h-full object-cover transition-transform duration-300 ${canHover ? 'group-hover:scale-105' : ''}`}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-[#141a29] to-[#080b12]'} flex items-center justify-center`}>
              <Music className="w-4 h-4 text-white/60" />
            </div>
          )}

          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
              isCurrent || isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <MotionIconSwap stateKey={isActivelyPlaying ? 'pause' : 'play'}>
              {isActivelyPlaying ? (
                <Pause className="w-3.5 h-3.5 text-white fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 text-white fill-current translate-x-0.5" />
              )}
            </MotionIconSwap>
          </div>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4
              className={`text-xs sm:text-sm font-medium truncate ${
                isCurrent ? 'text-white font-semibold' : 'text-zinc-200 group-hover:text-white'
              }`}
            >
              {track.title}
            </h4>
            {track.source === 'youtube' && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-500/15 text-red-300 border border-red-500/25 shrink-0">
                YouTube
              </span>
            )}
            {track.source === 'audius' && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                Audius
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300">
            {track.artist} {track.album ? `• ${track.album}` : ''}
          </p>
        </div>
      </div>

      {/* Row Right Controls */}
      <div className="flex items-center gap-3 shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => toggleFavorite(track.id)}
          className="p-1 text-zinc-500 hover:text-rose-400 aura-pressable aura-focus-ring transition-colors cursor-pointer"
          title="Favorite"
        >
          <motion.span
            className="inline-flex items-center justify-center"
            animate={!prefersReducedMotion && track.isFavorite ? { scale: [1, 1.24, 1] } : { scale: 1 }}
            transition={MOTION_TRANSITION.micro}
          >
            <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </motion.span>
        </button>

        <span className="text-xs font-mono text-zinc-500 w-10 text-right">
          {formatTime(track.duration)}
        </span>

        {/* Row Context Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/5 aura-pressable aura-focus-ring transition-opacity cursor-pointer ${
              !canHover || isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
            }`}
            title="Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <MotionPopover
                placement="bottom"
                style={{ pointerEvents: 'auto' }}
                className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#12141c] border border-white/10 shadow-2xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    openTrackInfo(track);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left aura-pressable cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  Track Info & Metadata
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playNext(track);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left aura-pressable cursor-pointer"
                >
                  <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
                  Play Next
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToQueue(track);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left aura-pressable cursor-pointer"
                >
                  <ListPlus className="w-3.5 h-3.5 text-cyan-400" />
                  Add to Queue
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    if (isInRoom) {
                      roomAddTrack(track);
                    } else {
                      createRoom(`${track.title} Session`, track).then(() => {
                        setCurrentView('listen-together');
                      });
                    }
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left aura-pressable cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  {isInRoom ? 'Add to Shared Room' : 'Play in Listen Together'}
                </button>
                {onOpenPlaylistModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPlaylistModal(track);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left aura-pressable cursor-pointer"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-amber-400" />
                    Add to Playlist...
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    deleteTrack(track.id);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg text-left aura-pressable cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Track
                </button>
              </MotionPopover>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
