import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Track } from '../../types';
import { 
  X, 
  Trash2, 
  Play, 
  Music, 
  ArrowUp, 
  ArrowDown, 
  ListMusic, 
  History, 
  Clock,
  Moon,
  Info
} from 'lucide-react';

export const QueueDrawer: React.FC = () => {
  const {
    isQueueDrawerOpen,
    setIsQueueDrawerOpen,
    queue,
    queueIndex,
    currentTrack,
    playTrack,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    history,
    isSleepTimerActive,
    sleepTimerRemainingSecs,
    setIsSleepTimerModalOpen,
    openTrackInfo,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  if (!isQueueDrawerOpen) return null;

  const upNextTracks = queue.slice(queueIndex + 1);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div 
        className="absolute inset-0" 
        onClick={() => setIsQueueDrawerOpen(false)} 
      />

      <div className="relative w-full max-w-full sm:max-w-md h-full bg-[#0c0d11]/98 border-l border-white/10 backdrop-blur-2xl flex flex-col shadow-2xl pb-safe animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Play Queue</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
            {queue.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Sleep Timer button */}
          <button
            onClick={() => setIsSleepTimerModalOpen(true)}
            className={`p-1.5 rounded-lg transition-colors ${
              isSleepTimerActive 
                ? 'text-indigo-400 bg-indigo-500/20' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={isSleepTimerActive ? `Sleep timer active (${sleepTimerRemainingSecs ? Math.ceil(sleepTimerRemainingSecs/60) + 'm left' : 'End of track'})` : 'Set Sleep Timer'}
          >
            <Moon className="w-4 h-4" />
          </button>

          {queue.length > 0 && activeTab === 'queue' && (
            <button
              onClick={clearQueue}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
              title="Clear Queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsQueueDrawerOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-white/5 px-4 pt-2">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'queue'
              ? 'border-indigo-500 text-indigo-300 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5" />
          Up Next ({upNextTracks.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-300 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Recently Played ({history.length})
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        
        {activeTab === 'queue' ? (
          <>
            {/* Now Playing Block */}
            {currentTrack && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  Now Playing
                </span>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/25">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/10">
                    {currentTrack.coverUrl ? (
                      <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${currentTrack.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
                        <Music className="w-4 h-4 text-white/80" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-semibold text-zinc-100 truncate">{currentTrack.title}</h5>
                    <p className="text-[11px] text-zinc-400 truncate">{currentTrack.artist}</p>
                  </div>
                  <span className="text-xs font-mono text-indigo-400">
                    {formatTime(currentTrack.duration)}
                  </span>
                </div>
              </div>
            )}

            {/* Up Next List */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                Next in Queue
              </span>

              {upNextTracks.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-xl border border-dashed border-white/5">
                  <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium text-zinc-400">No tracks queued</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">Add tracks using &quot;Play Next&quot; or &quot;Add to Queue&quot;</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {upNextTracks.map((track, relativeIdx) => {
                    const actualIdx = queueIndex + 1 + relativeIdx;
                    return (
                      <div
                        key={`${track.id}-${actualIdx}`}
                        className="group flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/80 border border-white/5 transition-all"
                      >
                        {/* Play button / Thumbnail */}
                        <div
                          onClick={() => playTrack(track, queue)}
                          className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-zinc-900 cursor-pointer"
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

                        <div className="min-w-0 flex-1" onClick={() => playTrack(track, queue)}>
                          <h5 className="text-xs font-medium text-zinc-200 truncate cursor-pointer hover:text-indigo-300">
                            {track.title}
                          </h5>
                          <p className="text-[11px] text-zinc-500 truncate">{track.artist}</p>
                        </div>

                        {/* Reorder up/down & Remove & Info */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTrackInfo(track);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded"
                            title="Track Info"
                          >
                            <Info className="w-3 h-3" />
                          </button>
                          {relativeIdx > 0 && (
                            <button
                              onClick={() => reorderQueue(actualIdx, actualIdx - 1)}
                              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                          )}
                          {relativeIdx < upNextTracks.length - 1 && (
                            <button
                              onClick={() => reorderQueue(actualIdx, actualIdx + 1)}
                              className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => removeFromQueue(actualIdx)}
                            className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-700/50 rounded"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                          {formatTime(track.duration)}
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
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-white/5">
                <History className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-zinc-400">No playback history</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">Songs you play will show up here</p>
              </div>
            ) : (
              history.map((track) => (
                <div
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className="group flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/80 border border-white/5 transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-zinc-900">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${track.coverColor || 'from-indigo-600 to-zinc-900'} flex items-center justify-center`}>
                        <Music className="w-3.5 h-3.5 text-white/80" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-medium text-zinc-200 truncate group-hover:text-indigo-300">
                      {track.title}
                    </h5>
                    <p className="text-[11px] text-zinc-500 truncate">{track.artist}</p>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                    {formatTime(track.duration)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
    </div>
  );
};
