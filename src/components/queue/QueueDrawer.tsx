import React, { useState, useMemo } from 'react';
import { useMusic } from '../../context/MusicContext';
import { useListenTogether } from '../../context/ListenTogetherContext';
import { Track, MusicSourceType } from '../../types';
import { 
  X, 
  Trash2, 
  Play, 
  Music, 
  ChevronUp, 
  ChevronDown, 
  ListMusic, 
  History, 
  Clock, 
  Moon, 
  Info,
  Shuffle,
  Sparkles,
  Users,
  AlertCircle
} from 'lucide-react';

function formatTime(secs?: number, source?: MusicSourceType): string {
  if (source === 'radio' || source === 'radiobrowser') return 'LIVE';
  if (typeof secs !== 'number' || isNaN(secs) || secs <= 0) return '—';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatRemainingDuration(totalSecs: number, hasUnknown: boolean): string {
  if (totalSecs <= 0) {
    return hasUnknown ? 'Duration varies' : '0 min';
  }
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else {
    formatted = `${minutes} min`;
  }

  return hasUnknown ? `~${formatted} (partial)` : formatted;
}

function getSourceBadge(source?: MusicSourceType): { label: string; className: string } {
  switch (source) {
    case 'local':
      return { 
        label: 'Local', 
        className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
      };
    case 'audius':
      return { 
        label: 'Audius', 
        className: 'text-purple-400 bg-purple-500/10 border-purple-500/20' 
      };
    case 'jamendo':
      return { 
        label: 'Jamendo', 
        className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
      };
    case 'youtube':
      return { 
        label: 'YouTube', 
        className: 'text-red-400 bg-red-500/10 border-red-500/20' 
      };
    case 'curated_stream':
      return { 
        label: 'Curated Stream', 
        className: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' 
      };
    case 'radio':
    case 'radiobrowser':
      return { 
        label: 'Radio', 
        className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' 
      };
    case 'web_stream':
      return { 
        label: 'Web Stream', 
        className: 'text-sky-400 bg-sky-500/10 border-sky-500/20' 
      };
    default:
      return { 
        label: 'Audio', 
        className: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' 
      };
  }
}

export const QueueDrawer: React.FC = () => {
  const {
    isQueueDrawerOpen,
    setIsQueueDrawerOpen,
    queue,
    setQueue,
    queueIndex,
    currentTrack,
    isPlaying,
    playTrack,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    history,
    isSleepTimerActive,
    sleepTimerRemainingSecs,
    setIsSleepTimerModalOpen,
    openTrackInfo,
    setCurrentView,
  } = useMusic();

  const { isInRoom, isOwner, activeRoom } = useListenTogether();

  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  // Slice only the upcoming tracks after queueIndex
  const upNextTracks = useMemo(() => {
    if (queueIndex < 0 || queueIndex >= queue.length) return [];
    return queue.slice(queueIndex + 1);
  }, [queue, queueIndex]);

  // Cumulative duration of upcoming tracks only
  const { totalRemainingSecs, hasUnknownDurations } = useMemo(() => {
    let total = 0;
    let unknownCount = 0;

    for (const track of upNextTracks) {
      const dur = track.duration;
      if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
        total += dur;
      } else {
        unknownCount++;
      }
    }

    return {
      totalRemainingSecs: total,
      hasUnknownDurations: unknownCount > 0,
    };
  }, [upNextTracks]);

  if (!isQueueDrawerOpen) return null;

  // Shuffle only upcoming tracks after queueIndex using Fisher-Yates
  const handleShuffleUpNext = () => {
    if (upNextTracks.length <= 1) return;

    setQueue((prevQueue) => {
      const currentIdx = queueIndex;
      if (currentIdx < 0 || currentIdx >= prevQueue.length - 1) return prevQueue;

      const preserved = prevQueue.slice(0, currentIdx + 1);
      const upcoming = [...prevQueue.slice(currentIdx + 1)];

      for (let i = upcoming.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
      }

      return [...preserved, ...upcoming];
    });
  };

  // Clear only upcoming tracks without stopping playback or touching current track
  const handleClearUpcoming = () => {
    if (upNextTracks.length === 0) return;

    setQueue((prevQueue) => {
      const currentIdx = queueIndex;
      if (currentIdx < 0 || currentIdx >= prevQueue.length) {
        return prevQueue;
      }
      // Preserve everything up to and including currentTrack
      return prevQueue.slice(0, currentIdx + 1);
    });
  };

  // Check if queue mutations are restricted by room host
  const isQueueControlRestricted = isInRoom && !isOwner;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md animate-in fade-in duration-200 select-none">
      {/* Backdrop tap to close */}
      <div 
        className="absolute inset-0" 
        onClick={() => setIsQueueDrawerOpen(false)} 
      />

      {/* Drawer Surface */}
      <div className="relative w-full max-w-full sm:max-w-md h-full glass-immersive border-l border-white/[0.14] flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.9)] pb-safe animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>Play Queue</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-zinc-400 font-mono border border-white/5">
                  {queue.length}
                </span>
              </h3>
              {upNextTracks.length > 0 && activeTab === 'queue' && (
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono mt-0.5">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>{formatRemainingDuration(totalRemainingSecs, hasUnknownDurations)}</span>
                  <span>•</span>
                  <span>{upNextTracks.length} up next</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Sleep Timer button */}
            <button
              onClick={() => setIsSleepTimerModalOpen(true)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isSleepTimerActive 
                  ? 'text-indigo-400 bg-indigo-500/20' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
              title={isSleepTimerActive ? `Sleep timer active (${sleepTimerRemainingSecs ? Math.ceil(sleepTimerRemainingSecs / 60) + 'm left' : 'End of track'})` : 'Set Sleep Timer'}
            >
              <Moon className="w-4 h-4" />
            </button>

            {/* Shuffle Up Next button */}
            {upNextTracks.length > 1 && activeTab === 'queue' && (
              <button
                onClick={handleShuffleUpNext}
                disabled={isQueueControlRestricted}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-white/5 disabled:opacity-40 disabled:hover:text-zinc-400 transition-colors cursor-pointer"
                title={isQueueControlRestricted ? 'Queue ordering managed by host' : 'Shuffle Up Next'}
              >
                <Shuffle className="w-4 h-4" />
              </button>
            )}

            {/* Clear Upcoming button */}
            {upNextTracks.length > 0 && activeTab === 'queue' && (
              <button
                onClick={handleClearUpcoming}
                disabled={isQueueControlRestricted}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/5 disabled:opacity-40 disabled:hover:text-zinc-400 transition-colors cursor-pointer"
                title={isQueueControlRestricted ? 'Queue ordering managed by host' : 'Clear Up Next'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={() => setIsQueueDrawerOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Listen Together Notification Banner */}
        {isInRoom && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/20 text-indigo-300 text-[11px]">
            <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate flex-1">
              {activeRoom?.name ? `Room: ${activeRoom.name}` : 'Listen Together Room'}
              {isOwner ? ' (Host)' : ' (Participant — Host controls queue)'}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center border-b border-white/[0.06] px-4 pt-1">
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'queue'
                ? 'border-indigo-500 text-indigo-300 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Up Next ({upNextTracks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-300 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Recently Played ({history.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          
          {activeTab === 'queue' ? (
            <>
              {/* Now Playing Block */}
              {currentTrack && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      Now Playing
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400">
                      {isPlaying ? 'Playing' : 'Paused'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/25 shadow-lg backdrop-blur-xl">
                    {/* Artwork */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#0e1017] border border-white/10 shadow-sm">
                      {currentTrack.coverUrl ? (
                        <img 
                          src={currentTrack.coverUrl} 
                          alt={currentTrack.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${currentTrack.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
                          <Music className="w-5 h-5 text-white/80" />
                        </div>
                      )}
                    </div>

                    {/* Metadata & Source */}
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-semibold text-white truncate">
                        {currentTrack.title}
                      </h5>
                      <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                        {currentTrack.artist}
                      </p>
                      
                      {/* Source badge */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {(() => {
                          const badge = getSourceBadge(currentTrack.source);
                          return (
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono border ${badge.className}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                        {currentTrack.album && (
                          <span className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                            • {currentTrack.album}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Duration */}
                    <span className="text-xs font-mono text-indigo-300 shrink-0">
                      {formatTime(currentTrack.duration, currentTrack.source)}
                    </span>
                  </div>
                </div>
              )}

              {/* Up Next List */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Next in Queue ({upNextTracks.length})
                  </span>
                  {hasUnknownDurations && (
                    <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Partial runtime
                    </span>
                  )}
                </div>

                {upNextTracks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl bg-[#0b0d13]/40 border border-dashed border-white/10">
                    <Clock className="w-8 h-8 text-zinc-600 mb-2 opacity-50" />
                    <p className="text-xs font-medium text-zinc-300">No tracks queued</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 mb-4 max-w-xs">
                      Add tracks using "Play Next" or "Add to Queue" from your music library
                    </p>
                    <button
                      onClick={() => {
                        setIsQueueDrawerOpen(false);
                        setCurrentView('songs');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer"
                    >
                      Browse Library
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {upNextTracks.map((track, relativeIdx) => {
                      const actualIdx = queueIndex + 1 + relativeIdx;
                      const badge = getSourceBadge(track.source);

                      return (
                        <div
                          key={`${track.id}-${actualIdx}`}
                          className="group flex items-center gap-2.5 p-2 rounded-xl bg-[#0b0d13]/60 hover:bg-[#121520]/80 border border-white/[0.04] hover:border-white/[0.08] transition-all"
                        >
                          {/* Play Thumbnail */}
                          <div
                            onClick={() => playTrack(track, queue)}
                            className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-[#0e1017] border border-white/10 cursor-pointer"
                            title={`Play "${track.title}"`}
                          >
                            {track.coverUrl ? (
                              <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
                                <Music className="w-3.5 h-3.5 text-white/80" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="w-3.5 h-3.5 text-white fill-current" />
                            </div>
                          </div>

                          {/* Info */}
                          <div 
                            className="min-w-0 flex-1 cursor-pointer" 
                            onClick={() => playTrack(track, queue)}
                          >
                            <h5 className="text-xs font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                              {track.title}
                            </h5>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-zinc-400 truncate">
                                {track.artist}
                              </span>
                              <span className={`inline-block px-1 rounded text-[8px] font-mono border ${badge.className}`}>
                                {badge.label}
                              </span>
                            </div>
                          </div>

                          {/* Reorder and Removal Controls */}
                          <div className="flex items-center gap-0.5 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Track Info */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openTrackInfo(track);
                              }}
                              className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                              title="Track Info"
                            >
                              <Info className="w-3 h-3" />
                            </button>

                            {/* Move Up */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (relativeIdx > 0 && !isQueueControlRestricted) {
                                  reorderQueue(actualIdx, actualIdx - 1);
                                }
                              }}
                              disabled={relativeIdx === 0 || isQueueControlRestricted}
                              className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 rounded hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
                              title={relativeIdx === 0 ? 'Cannot move above current track' : 'Move Up'}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Move Down */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (relativeIdx < upNextTracks.length - 1 && !isQueueControlRestricted) {
                                  reorderQueue(actualIdx, actualIdx + 1);
                                }
                              }}
                              disabled={relativeIdx === upNextTracks.length - 1 || isQueueControlRestricted}
                              className="p-1 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 rounded hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed"
                              title={relativeIdx === upNextTracks.length - 1 ? 'End of queue' : 'Move Down'}
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Remove from queue */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isQueueControlRestricted) {
                                  removeFromQueue(actualIdx);
                                }
                              }}
                              disabled={isQueueControlRestricted}
                              className="p-1 text-zinc-400 hover:text-rose-400 disabled:opacity-30 rounded hover:bg-white/10 transition-colors cursor-pointer"
                              title="Remove from queue"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Duration */}
                          <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                            {formatTime(track.duration, track.source)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* History Tab */
            <div className="flex flex-col gap-1.5">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl bg-[#0b0d13]/40 border border-dashed border-white/10">
                  <History className="w-8 h-8 text-zinc-600 mb-2 opacity-50" />
                  <p className="text-xs font-medium text-zinc-300">No playback history</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Songs you play will show up here</p>
                </div>
              ) : (
                history.map((track) => {
                  const badge = getSourceBadge(track.source);

                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track)}
                      className="group flex items-center gap-2.5 p-2 rounded-xl bg-[#0b0d13]/60 hover:bg-[#121520]/80 border border-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-[#0e1017] border border-white/10">
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
                            <Music className="w-3.5 h-3.5 text-white/80" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                          {track.title}
                        </h5>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-zinc-400 truncate">
                            {track.artist}
                          </span>
                          <span className={`inline-block px-1 rounded text-[8px] font-mono border ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                        {formatTime(track.duration, track.source)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
