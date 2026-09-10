import React, { useState } from 'react';
import { Track } from '../../types';
import { useMusic } from '../../context/MusicContext';
import { useListenTogether } from '../../context/ListenTogetherContext';
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsMenuOpen(false);
        }}
        className={`group relative flex flex-col cursor-pointer transition-all duration-300 ease-out select-none ${className}`}
      >
        {/* Artwork Container as the Core Physical/Digital Music Object */}
        <div
          onClick={handleCardClick}
          className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-[#0c0d12] transition-all duration-300 ease-out ${
            isCurrent
              ? 'ring-1 ring-indigo-500/40 shadow-[0_12px_36px_rgba(99,102,241,0.22)] scale-[1.01]'
              : 'shadow-lg shadow-black/40 group-hover:shadow-2xl group-hover:shadow-indigo-500/10 group-hover:scale-[1.025]'
          }`}
        >
          {/* Track Artwork */}
          {track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt={track.title}
              className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
                isActivelyPlaying ? 'scale-[1.03]' : 'group-hover:scale-[1.04]'
              }`}
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-600 via-zinc-900 to-zinc-950'} flex flex-col items-center justify-center p-4 text-white/90`}>
              <Disc className="w-10 h-10 opacity-60 mb-2 stroke-1 group-hover:rotate-12 transition-transform duration-500" />
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-60 font-semibold">
                {track.fileFormat || 'AURA'}
              </span>
            </div>
          )}

          {/* Atmospheric Soft Light Spill on Hover & Playing */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
              isCurrent
                ? 'opacity-30 bg-gradient-to-t from-indigo-950/80 via-transparent to-transparent'
                : 'opacity-0 group-hover:opacity-20 bg-gradient-to-t from-black/80 to-transparent'
            }`}
          />

          {/* Integrated Floating Play / Active Signal Control */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              isCurrent || isHovered
                ? 'opacity-100 backdrop-blur-[1.5px] bg-black/30'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActivelyPlaying
                  ? 'bg-white text-zinc-950 shadow-[0_0_24px_rgba(255,255,255,0.4)] scale-100'
                  : 'bg-white/90 hover:bg-white text-zinc-950 hover:scale-105 shadow-xl shadow-black/50'
              }`}
            >
              {isActivelyPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              )}
            </div>
          </div>

          {/* Live Frequency Equalizer Animation for Active Track */}
          {isActivelyPlaying && (
            <div className="absolute bottom-2.5 left-2.5 flex items-end gap-0.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-sm pointer-events-none">
              <span className="w-0.5 h-3 bg-indigo-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
              <span className="w-0.5 h-4 bg-indigo-300 rounded-full animate-[pulse_0.9s_ease-in-out_infinite_0.2s]" />
              <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.4s]" />
              <span className="w-0.5 h-3.5 bg-violet-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.1s]" />
            </div>
          )}

          {/* Top Left Source Badge if Audius or YouTube */}
          {(track.source === 'youtube' || track.source === 'audius') && (
            <div className="absolute top-2.5 left-2.5 pointer-events-none">
              <span className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded-md backdrop-blur-md border shadow-sm ${
                track.source === 'youtube'
                  ? 'bg-red-950/80 text-red-300 border-red-500/30'
                  : 'bg-purple-950/80 text-purple-300 border-purple-500/30'
              }`}>
                {track.source === 'youtube' ? 'YouTube' : 'Audius'}
              </span>
            </div>
          )}

          {/* Duration / Format Tag in top right */}
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10">
              {formatTime(track.duration)}
            </span>
          </div>
        </div>

        {/* Object Metadata & Subtle Controls */}
        <div className="flex items-start justify-between gap-2 mt-3 px-0.5">
          <div className="min-w-0 flex-1" onClick={handleCardClick}>
            <h3
              className={`text-xs sm:text-sm font-semibold truncate transition-colors leading-snug ${
                isCurrent
                  ? 'text-indigo-300 font-bold'
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
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => toggleFavorite(track.id)}
              className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
              title={track.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            {/* Context Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {isMenuOpen && (
                <div 
                  className="absolute right-0 bottom-full mb-1.5 w-44 rounded-xl bg-[#12141c] border border-white/10 shadow-2xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      openTrackInfo(track);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left"
                  >
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    Track Info & Metadata
                  </button>
                  <button
                    onClick={() => {
                      playNext(track);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left"
                  >
                    <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
                    Play Next
                  </button>
                  <button
                    onClick={() => {
                      addToQueue(track);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left"
                  >
                    <ListPlus className="w-3.5 h-3.5 text-cyan-400" />
                    Add to Queue
                  </button>
                  <button
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
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    {isInRoom ? 'Add to Shared Room' : 'Play in Listen Together'}
                  </button>
                  {onOpenPlaylistModal && (
                    <button
                      onClick={() => {
                        onOpenPlaylistModal(track);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left"
                    >
                      <ListPlus className="w-3.5 h-3.5 text-amber-400" />
                      Add to Playlist...
                    </button>
                  )}
                  <button
                    onClick={() => {
                      deleteTrack(track.id);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Track
                  </button>
                </div>
              )}
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsMenuOpen(false);
      }}
      className={`group relative flex items-center justify-between p-2.5 sm:px-3.5 rounded-xl transition-all duration-200 cursor-pointer select-none ${
        isCurrent
          ? 'bg-indigo-950/30 text-indigo-200 border-l-2 border-indigo-500 pl-3'
          : 'hover:bg-white/[0.03] text-zinc-300'
      } ${className}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {showIndex !== undefined && (
          <span className="text-xs font-mono text-zinc-500 w-5 shrink-0 text-center">
            {isActivelyPlaying ? (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            ) : (
              showIndex
            )}
          </span>
        )}

        {/* Thumbnail Object */}
        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#0e1017] border border-white/5 shadow-sm">
          {track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt={track.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
              <Music className="w-4 h-4 text-white/80" />
            </div>
          )}

          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
              isCurrent || isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {isActivelyPlaying ? (
              <Pause className="w-3.5 h-3.5 text-white fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 text-white fill-current translate-x-0.5" />
            )}
          </div>
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4
              className={`text-xs sm:text-sm font-medium truncate ${
                isCurrent ? 'text-indigo-300 font-semibold' : 'text-zinc-200 group-hover:text-white'
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
          onClick={() => toggleFavorite(track.id)}
          className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
          title="Favorite"
        >
          <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        <span className="text-xs font-mono text-zinc-500 w-10 text-right">
          {formatTime(track.duration)}
        </span>

        {/* Row Context Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {isMenuOpen && (
            <div 
              className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#12141c] border border-white/10 shadow-2xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  openTrackInfo(track);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left"
              >
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Track Info & Metadata
              </button>
              <button
                onClick={() => {
                  playNext(track);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left"
              >
                <ListMusic className="w-3.5 h-3.5 text-indigo-400" />
                Play Next
              </button>
              <button
                onClick={() => {
                  addToQueue(track);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left"
              >
                <ListPlus className="w-3.5 h-3.5 text-cyan-400" />
                Add to Queue
              </button>
              <button
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
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left"
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                {isInRoom ? 'Add to Shared Room' : 'Play in Listen Together'}
              </button>
              {onOpenPlaylistModal && (
                <button
                  onClick={() => {
                    onOpenPlaylistModal(track);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 rounded-lg text-left"
                >
                  <ListPlus className="w-3.5 h-3.5 text-amber-400" />
                  Add to Playlist...
                </button>
              )}
              <button
                onClick={() => {
                  deleteTrack(track.id);
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Track
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
