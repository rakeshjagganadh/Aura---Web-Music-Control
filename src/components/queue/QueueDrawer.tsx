import React, { useState, useMemo } from 'react';
import { AnimatePresence, LayoutGroup } from 'motion/react';
import { MotionBackdrop, MotionModal, MotionFadeSlide } from '../common/motion/MotionSurface';
import { SharedIndicator } from '../common/motion/MotionInteractive';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';
import { useMusic } from '../../context/MusicContext';
import { useListenTogether } from '../../context/ListenTogetherContext';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import { Track, MusicSourceType } from '../../types';
import { AuraIcon } from '../ui/AuraIcon';

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
  const { canHover } = useMotionCapabilities();
  const drawerRef = useDialogAccessibility<HTMLDivElement>({
    isOpen: isQueueDrawerOpen,
    onClose: () => setIsQueueDrawerOpen(false),
  });

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
    <AnimatePresence>
      {isQueueDrawerOpen && (
        <MotionBackdrop
          onClick={() => setIsQueueDrawerOpen(false)}
          style={{ pointerEvents: isQueueDrawerOpen ? 'auto' : 'none' }}
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md select-none"
        >
          {/* Drawer Surface */}
          <MotionModal
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Play Queue"
            variant="drawer-right"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-full sm:max-w-md h-full glass-immersive border-l border-white/[0.14] flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.9)] pb-safe"
          >
        
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AuraIcon name="playlist" size={18} className="text-zinc-300 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                <span>Play Queue</span>
                <span className="text-xs text-zinc-500 font-mono tabular-nums font-normal">
                  · {queue.length}
                </span>
              </h3>
              {upNextTracks.length > 0 && activeTab === 'queue' && (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-sans mt-0.5">
                  <span className="font-mono tabular-nums">{formatRemainingDuration(totalRemainingSecs, hasUnknownDurations)}</span>
                  <span aria-hidden="true">·</span>
                  <span><span className="font-mono tabular-nums">{upNextTracks.length}</span> up next</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Sleep Timer button */}
            <button
              type="button"
              onClick={() => setIsSleepTimerModalOpen(true)}
              aria-label="Sleep Timer"
              className={`w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer aura-pressable aura-focus-ring ${
                isSleepTimerActive 
                  ? 'text-indigo-400 bg-indigo-500/20' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
              title={isSleepTimerActive ? `Sleep timer active (${sleepTimerRemainingSecs ? Math.ceil(sleepTimerRemainingSecs / 60) + 'm left' : 'End of track'})` : 'Set Sleep Timer'}
            >
              <AuraIcon name="moon" size={16} />
            </button>

            {/* Shuffle Up Next button */}
            {upNextTracks.length > 1 && activeTab === 'queue' && (
              <button
                type="button"
                onClick={handleShuffleUpNext}
                disabled={isQueueControlRestricted}
                aria-label="Shuffle Up Next"
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-white/5 disabled:opacity-40 disabled:hover:text-zinc-400 transition-colors cursor-pointer aura-pressable aura-focus-ring"
                title={isQueueControlRestricted ? 'Queue ordering managed by host' : 'Shuffle Up Next'}
              >
                <AuraIcon name="shuffle" size={16} />
              </button>
            )}

            {/* Clear Upcoming button */}
            {upNextTracks.length > 0 && activeTab === 'queue' && (
              <button
                type="button"
                onClick={handleClearUpcoming}
                disabled={isQueueControlRestricted}
                aria-label="Clear Up Next"
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/5 disabled:opacity-40 disabled:hover:text-zinc-400 transition-colors cursor-pointer aura-pressable aura-focus-ring"
                title={isQueueControlRestricted ? 'Queue ordering managed by host' : 'Clear Up Next'}
              >
                <AuraIcon name="trash" size={16} />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsQueueDrawerOpen(false)}
              aria-label="Close Play Queue"
              className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer aura-pressable aura-focus-ring"
              title="Close Drawer"
            >
              <AuraIcon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* Listen Together Notification Banner */}
        {isInRoom && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/20 text-indigo-300 text-[11px]">
            <AuraIcon name="users" size={14} className="text-indigo-400 shrink-0" />
            <span className="truncate flex-1">
              {activeRoom?.roomName ? `Room: ${activeRoom.roomName}` : 'Listen Together Room'}
              {isOwner ? ' (Host)' : ' (Participant — Host controls queue)'}
            </span>
          </div>
        )}

        {/* Tabs */}
        <LayoutGroup id="queue-drawer-tabs">
          <div className="flex items-center border-b border-white/[0.06] px-4 pt-1">
            <button
              onClick={() => setActiveTab('queue')}
              className={`relative min-h-[40px] flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer aura-pressable ${
                activeTab === 'queue'
                  ? 'text-indigo-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <AuraIcon name="playlist" size={14} />
              <span>Up Next ({upNextTracks.length})</span>
              {activeTab === 'queue' && (
                <SharedIndicator
                  layoutId="queue-drawer-tab-bar"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-indigo-500"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`relative min-h-[40px] flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer aura-pressable ${
                activeTab === 'history'
                  ? 'text-indigo-300 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <AuraIcon name="history" size={14} />
              <span>Recently Played ({history.length})</span>
              {activeTab === 'history' && (
                <SharedIndicator
                  layoutId="queue-drawer-tab-bar"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-indigo-500"
                />
              )}
            </button>
          </div>
        </LayoutGroup>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'queue' ? (
              <MotionFadeSlide key="queue" direction="up" distance={6} duration="micro" className="flex flex-col gap-5">
              {/* Now Playing Block */}
              {currentTrack && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <AuraIcon name="sparkles" size={12} className="text-indigo-400" />
                      Now Playing
                    </span>
                    <span className="text-[10px] font-sans font-medium text-indigo-400">
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
                          <AuraIcon name="musicNote" size={20} className="text-white/80" />
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
                      
                      {/* Clean unboxed metadata attribution */}
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {getSourceBadge(currentTrack.source).label}
                        {currentTrack.album && ` · ${currentTrack.album}`}
                      </p>
                    </div>

                    {/* Duration */}
                    <span className="text-xs font-mono tabular-nums text-indigo-300 shrink-0">
                      {formatTime(currentTrack.duration, currentTrack.source)}
                    </span>
                  </div>
                </div>
              )}

              {/* Up Next List */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-zinc-400">
                    Next in Queue ({upNextTracks.length})
                  </span>
                  {hasUnknownDurations && (
                    <span className="text-[10px] font-sans font-medium text-amber-400 flex items-center gap-1">
                      <AuraIcon name="alertCircle" size={12} />
                      Partial runtime
                    </span>
                  )}
                </div>

                {upNextTracks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl bg-[#0b0d13]/40 border border-dashed border-white/10">
                    <AuraIcon name="clock" size={32} className="text-zinc-600 mb-2 opacity-50" />
                    <p className="text-xs font-medium text-zinc-300">No tracks queued</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 mb-4 max-w-xs">
                      Add tracks using "Play Next" or "Add to Queue" from your music library
                    </p>
                    <button
                      onClick={() => {
                        setIsQueueDrawerOpen(false);
                        setCurrentView('songs');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer aura-pressable"
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
                          className="group flex items-center gap-2.5 p-2 rounded-xl bg-[#0b0d13]/60 hover:bg-[#121520]/80 border border-white/[0.04] hover:border-white/[0.08] transition-colors"
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
                                <AuraIcon name="musicNote" size={14} className="text-white/80" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <AuraIcon name="play" size={14} filled className="text-white" />
                            </div>
                          </div>

                          {/* Info */}
                          <div 
                            role="button"
                            tabIndex={0}
                            aria-label={`Play ${track.title} by ${track.artist}`}
                            className="min-w-0 flex-1 cursor-pointer aura-focus-ring rounded" 
                            onClick={() => playTrack(track, queue)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                playTrack(track, queue);
                              }
                            }}
                          >
                            <h5 className="text-xs font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                              {track.title}
                            </h5>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {track.artist}
                              <span className="text-zinc-500"> · {badge.label}</span>
                            </p>
                          </div>

                          {/* Reorder and Removal Controls */}
                          <div className={`flex items-center gap-0.5 transition-opacity ${!canHover ? 'opacity-90' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                            {/* Track Info */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTrackInfo(track);
                              }}
                              className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-zinc-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer aura-pressable aura-focus-ring"
                              title="Track Info"
                              aria-label={`Track info for ${track.title}`}
                            >
                              <AuraIcon name="info" size={14} />
                            </button>

                            {/* Move Up */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (relativeIdx > 0 && !isQueueControlRestricted) {
                                  reorderQueue(actualIdx, actualIdx - 1);
                                }
                              }}
                              disabled={relativeIdx === 0 || isQueueControlRestricted}
                              className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 rounded hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed aura-pressable aura-focus-ring"
                              title={relativeIdx === 0 ? 'Cannot move above current track' : 'Move Up'}
                              aria-label={`Move ${track.title} up in queue`}
                            >
                              <AuraIcon name="chevronUp" size={15} />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (relativeIdx < upNextTracks.length - 1 && !isQueueControlRestricted) {
                                  reorderQueue(actualIdx, actualIdx + 1);
                                }
                              }}
                              disabled={relativeIdx === upNextTracks.length - 1 || isQueueControlRestricted}
                              className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-400 rounded hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed aura-pressable aura-focus-ring"
                              title={relativeIdx === upNextTracks.length - 1 ? 'End of queue' : 'Move Down'}
                              aria-label={`Move ${track.title} down in queue`}
                            >
                              <AuraIcon name="chevronDown" size={15} />
                            </button>

                            {/* Remove from queue */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isQueueControlRestricted) {
                                  removeFromQueue(actualIdx);
                                }
                              }}
                              disabled={isQueueControlRestricted}
                              className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center text-zinc-400 hover:text-rose-400 disabled:opacity-30 rounded hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed aura-pressable aura-focus-ring"
                              title="Remove from queue"
                              aria-label={`Remove ${track.title} from queue`}
                            >
                              <AuraIcon name="trash" size={14} />
                            </button>
                          </div>

                          {/* Duration */}
                          <span className="text-[11px] font-mono tabular-nums text-zinc-400 shrink-0">
                            {formatTime(track.duration, track.source)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              </MotionFadeSlide>
            ) : (
              /* History Tab */
              <MotionFadeSlide key="history" direction="up" distance={6} duration="micro" className="flex flex-col gap-1.5">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 rounded-2xl bg-[#0b0d13]/40 border border-dashed border-white/10">
                  <AuraIcon name="history" size={32} className="text-zinc-600 mb-2 opacity-50" />
                  <p className="text-xs font-medium text-zinc-300">No playback history</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Songs you play will show up here</p>
                </div>
              ) : (
                history.map((track) => {
                  const badge = getSourceBadge(track.source);

                  return (
                    <div
                      key={track.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Play ${track.title} by ${track.artist}`}
                      onClick={() => playTrack(track)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          playTrack(track);
                        }
                      }}
                      className="group flex items-center gap-2.5 p-2 rounded-xl bg-[#0b0d13]/60 hover:bg-[#121520]/80 border border-white/[0.04] hover:border-white/[0.08] transition-colors cursor-pointer aura-pressable-subtle aura-focus-ring"
                    >
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-[#0e1017] border border-white/10">
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
                            <AuraIcon name="musicNote" size={14} className="text-white/80" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                          {track.title}
                        </h5>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {track.artist}
                          <span className="text-zinc-500"> · {badge.label}</span>
                        </p>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-zinc-400 shrink-0">
                        {formatTime(track.duration, track.source)}
                      </span>
                    </div>
                  );
                })
              )}
              </MotionFadeSlide>
            )}
          </AnimatePresence>

        </div>
          </MotionModal>
        </MotionBackdrop>
      )}
    </AnimatePresence>
  );
};
