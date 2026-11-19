import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Track } from '../../types';
import { useMusic } from '../../context/MusicContext';
import { useListenTogether } from '../../context/ListenTogetherContext';
import { MotionPopover } from '../common/motion/MotionSurface';
import { MotionIconSwap } from '../common/motion/MotionInteractive';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';
import { MOTION_TRANSITION } from '../../motion/tokens';
import { AuraIcon } from '../ui/AuraIcon';

interface TrackRowProps {
  track: Track;
  index?: number;
  playlistContext?: Track[];
  isSelected?: boolean;
  onToggleSelect?: (trackId: string, e?: React.MouseEvent) => void;
  onOpenPlaylistModal?: (track: Track) => void;
  onRemove?: (trackId: string) => void;
  removeLabel?: string;
  onSelectArtist?: (artistName: string) => void;
  onSelectAlbum?: (albumName: string) => void;
  showAlbum?: boolean;
  showDateAdded?: boolean;
  showSelection?: boolean;
  searchQuery?: string;
  className?: string;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  playlistContext,
  isSelected = false,
  onToggleSelect,
  onOpenPlaylistModal,
  onRemove,
  removeLabel,
  onSelectArtist,
  onSelectAlbum,
  showAlbum = true,
  showDateAdded = false,
  showSelection = false,
  searchQuery = '',
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
    isLocallySilenced,
    roomTogglePlay,
    roomPlayTrack,
    roomAddTrack,
    createRoom,
  } = useListenTogether();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const { canHover, prefersReducedMotion } = useMotionCapabilities();

  const isCurrent = currentTrack?.id === track.id;
  const isActivelyPlaying = isCurrent && isPlaying;

  // Close context menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsMenuOpen(false);
        menuTriggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleRowClick = () => {
    if (isInRoom && !isLocallySilenced) {
      if (isCurrent) {
        void roomTogglePlay();
      } else {
        void roomPlayTrack(track);
      }
      return;
    }

    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, playlistContext);
    }
  };

  const formatDuration = (secs?: number) => {
    if (!secs || isNaN(secs) || secs <= 0) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Text highlight helper for search queries
  const renderHighlightedText = (text: string) => {
    if (!searchQuery || !searchQuery.trim()) return text;
    const q = searchQuery.trim();
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <span key={i} className="bg-sky-500/25 text-sky-200 px-0.5 rounded font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Source attribution label
  const getSourceLabel = () => {
    if (!track.source || track.source === 'local') {
      return track.fileFormat ? `Vault · ${track.fileFormat}` : 'Vault · Audio';
    }
    if (track.source === 'jamendo') return 'Jamendo · MP3';
    if (track.source === 'audius') return 'Audius · Web3';
    if (track.source === 'youtube') return 'YouTube · Stream';
    if (track.source === 'radio') return 'Live · Radio';
    return 'Web Stream';
  };

  return (
    <div
      id={`track-row-${track.id}`}
      role="button"
      tabIndex={0}
      aria-label={`${isActivelyPlaying ? 'Pause' : 'Play'} ${track.title} by ${track.artist}`}
      onMouseEnter={() => { if (canHover) setIsHovered(true); }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleRowClick();
        }
      }}
      className={`group relative flex items-center justify-between gap-3 px-3 py-2 sm:py-2.5 rounded-xl transition-colors duration-150 cursor-pointer select-none aura-focus-ring ${
        isCurrent
          ? 'bg-white/[0.08] text-white shadow-sm border border-white/10'
          : isSelected
          ? 'bg-sky-500/10 text-zinc-200 border border-sky-500/20'
          : 'hover:bg-white/[0.04] text-zinc-300 border border-transparent'
      } ${className}`}
    >
      {/* -------------------------------------------------------------
          LEFT ZONE: SELECTION / INDEX + PLAY BUTTON + ARTWORK + TITLE
          ------------------------------------------------------------- */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        {/* Selection Checkbox */}
        {showSelection && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleSelect) onToggleSelect(track.id, e);
            }}
            className="w-5 h-5 flex items-center justify-center shrink-0 text-zinc-500 hover:text-white transition-colors cursor-pointer"
            title={isSelected ? 'Deselect track' : 'Select track'}
          >
            {isSelected ? (
              <AuraIcon name="checkSquare" size={16} filled className="text-sky-400" />
            ) : (
              <AuraIcon name="square" size={16} className="text-zinc-600 group-hover:text-zinc-400" />
            )}
          </button>
        )}

        {/* Index or Active Playback Equalizer Signal */}
        {index !== undefined && !showSelection && (
          <div className="w-6 shrink-0 flex items-center justify-center text-xs font-mono">
            {isActivelyPlaying ? (
              <div className="flex items-end gap-0.5 h-3.5">
                <span className={`w-0.5 h-2 bg-sky-400 rounded-full ${!prefersReducedMotion ? 'animate-pulse' : ''}`} />
                <span className={`w-0.5 h-3.5 bg-emerald-400 rounded-full ${!prefersReducedMotion ? 'animate-[pulse_0.6s_ease-in-out_infinite]' : ''}`} />
                <span className={`w-0.5 h-2.5 bg-sky-300 rounded-full ${!prefersReducedMotion ? 'animate-[pulse_0.9s_ease-in-out_infinite]' : ''}`} />
              </div>
            ) : isCurrent ? (
              <span className="w-2 h-2 rounded-full bg-sky-400" />
            ) : isHovered ? (
              <AuraIcon name="play" size={14} filled className="text-white translate-x-0.5" />
            ) : (
              <span className="text-zinc-500 font-mono text-[11px] tabular-nums">{index}</span>
            )}
          </div>
        )}

        {/* Tactile Artwork Thumbnail (~40px) */}
        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/10 shadow-sm">
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
            <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-950 to-zinc-900'} flex items-center justify-center`}>
              <AuraIcon name="musicNote" size={16} className="text-white/50" />
            </div>
          )}

          {/* Micro Play Overlay Button */}
          <div
            className={`absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <MotionIconSwap stateKey={isActivelyPlaying ? 'pause' : 'play'}>
              {isActivelyPlaying ? (
                <AuraIcon name="pause" size={14} filled className="text-white" />
              ) : (
                <AuraIcon name="play" size={14} filled className="text-white translate-x-0.5" />
              )}
            </MotionIconSwap>
          </div>
        </div>

        {/* Title, Artist and Mobile Album */}
        <div className="min-w-0 flex-1">
          <h4 className={`text-xs sm:text-sm font-semibold truncate leading-tight font-ui-title ${
            isCurrent ? 'text-sky-300' : 'text-zinc-100 group-hover:text-white'
          }`}>
            {renderHighlightedText(track.title)}
          </h4>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5 truncate font-ui-meta">
            <span
              onClick={(e) => {
                if (onSelectArtist && track.artist) {
                  e.stopPropagation();
                  onSelectArtist(track.artist);
                }
              }}
              className={onSelectArtist ? 'hover:text-white hover:underline cursor-pointer' : ''}
            >
              {renderHighlightedText(track.artist || 'Unknown Artist')}
            </span>

            {/* Mobile-only subtle album mention */}
            {track.album && (
              <>
                <span className="sm:hidden text-zinc-600" aria-hidden="true">·</span>
                <span className="sm:hidden text-zinc-500 truncate">
                  {track.album}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MIDDLE ZONE: ALBUM & DATE ADDED (DESKTOP)
          ------------------------------------------------------------- */}
      {showAlbum && (
        <div className="hidden md:block w-44 lg:w-56 shrink-0 truncate text-xs text-zinc-400 font-ui-meta">
          {track.album ? (
            <span
              onClick={(e) => {
                if (onSelectAlbum && track.album) {
                  e.stopPropagation();
                  onSelectAlbum(track.album);
                }
              }}
              className={onSelectAlbum ? 'hover:text-white hover:underline cursor-pointer' : ''}
              title={track.album}
            >
              {renderHighlightedText(track.album)}
            </span>
          ) : (
            <span className="text-zinc-600">—</span>
          )}
        </div>
      )}

      {showDateAdded && (
        <div className="hidden lg:block w-28 shrink-0 text-xs text-zinc-500 font-mono tabular-nums">
          {formatDate(track.dateAdded)}
        </div>
      )}

      {/* Source & Format Tag (Desktop) */}
      <div className="hidden xl:block w-28 shrink-0 text-[11px] font-mono text-zinc-500 truncate" title={getSourceLabel()}>
        {getSourceLabel()}
      </div>

      {/* -------------------------------------------------------------
          RIGHT ZONE: FAVORITE + DURATION + CONTEXT MENU
          ------------------------------------------------------------- */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={() => toggleFavorite(track.id)}
          aria-pressed={Boolean(track.isFavorite)}
          className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg aura-pressable transition-colors cursor-pointer aura-focus-ring ${
            track.isFavorite
              ? 'text-rose-400 hover:text-rose-300'
              : !canHover
                ? 'text-zinc-500 hover:text-zinc-200 opacity-100'
                : 'text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100'
          }`}
          title={track.isFavorite ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
          aria-label={track.isFavorite ? `Remove ${track.title} from Liked Songs` : `Save ${track.title} to Liked Songs`}
        >
          <motion.span
            className="inline-flex items-center justify-center"
            initial={false}
            animate={!prefersReducedMotion && track.isFavorite ? { scale: [1, 1.24, 1] } : { scale: 1 }}
            transition={MOTION_TRANSITION.micro}
          >
            <AuraIcon name="heart" size={16} filled={Boolean(track.isFavorite)} className={track.isFavorite ? 'text-rose-500' : ''} />
          </motion.span>
        </button>

        {/* Tabular Duration */}
        <span className="text-xs font-mono text-zinc-400 tabular-nums w-12 text-right">
          {formatDuration(track.duration)}
        </span>

        {/* Context Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label={`More options for ${track.title}`}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] aura-pressable transition-colors cursor-pointer aura-focus-ring"
            title="More track options"
          >
            <AuraIcon name="more" size={16} />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <MotionPopover
                placement="top"
                role="menu"
                aria-label={`Options for ${track.title}`}
                style={{ pointerEvents: 'auto' }}
                className="absolute right-0 bottom-full mb-1.5 w-48 rounded-2xl aura-glass-island shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 border border-white/10 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    playNext(track);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-left aura-pressable aura-focus-ring transition-colors cursor-pointer"
                >
                  <AuraIcon name="playlist" size={14} className="text-sky-400" />
                  <span>Play Next</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    addToQueue(track);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-left aura-pressable aura-focus-ring transition-colors cursor-pointer"
                >
                  <AuraIcon name="playlistAdd" size={14} className="text-indigo-400" />
                  <span>Add to Queue</span>
                </button>

                {onOpenPlaylistModal && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onOpenPlaylistModal(track);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-left aura-pressable aura-focus-ring transition-colors cursor-pointer"
                  >
                    <AuraIcon name="playlistAdd" size={14} className="text-amber-400" />
                    <span>Add to Playlist...</span>
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (isInRoom) {
                      roomAddTrack(track);
                    } else {
                      createRoom(`${track.title} Session`, track).then(() => {
                        setCurrentView('listen-together');
                      });
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-left aura-pressable aura-focus-ring transition-colors cursor-pointer"
                >
                  <AuraIcon name="users" size={14} className="text-purple-400" />
                  <span>{isInRoom ? 'Add to Room' : 'Listen Together'}</span>
                </button>

                {track.artist && onSelectArtist && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onSelectArtist(track.artist);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-left aura-pressable aura-focus-ring transition-colors cursor-pointer"
                  >
                    <AuraIcon name="musicNote" size={14} className="text-zinc-400" />
                    <span>View Artist</span>
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    openTrackInfo(track);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-200 hover:text-white hover:bg-white/[0.08] rounded-xl text-left aura-pressable aura-focus-ring transition-colors cursor-pointer"
                >
                  <AuraIcon name="info" size={14} className="text-zinc-400" />
                  <span>Track Details</span>
                </button>

                {/* Remove or Delete Option */}
                {onRemove ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onRemove(track.id);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl text-left aura-pressable aura-focus-ring transition-colors cursor-pointer border-t border-white/[0.06] mt-1"
                  >
                    <AuraIcon name="trash" size={14} />
                    <span>{removeLabel || 'Remove'}</span>
                  </button>
                ) : (!track.source || track.source === 'local') ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      deleteTrack(track.id);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl text-left aura-pressable aura-focus-ring transition-colors cursor-pointer border-t border-white/[0.06] mt-1"
                  >
                    <AuraIcon name="trash" size={14} />
                    <span>Delete from Vault</span>
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
