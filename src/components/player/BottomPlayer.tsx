import React, { useState, useRef, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { useListenTogether } from '../../context/ListenTogetherContext';
import { WaveformScrubber } from '../waveform/WaveformScrubber';
import { SolidCard } from '../common/primitives/SolidCard';
import { TactileButton } from '../common/primitives/TactileButton';
import { TelemetryBadge } from '../common/primitives/TelemetryBadge';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  Volume1, 
  Heart, 
  ListMusic, 
  SlidersHorizontal, 
  Maximize2, 
  Music,
  Moon,
  Info,
  MoreHorizontal,
  Disc
} from 'lucide-react';

export const BottomPlayer: React.FC = () => {
  const {
    currentTrack,
    isDirectStreamActive,
    isPlaying,
    currentTime,
    duration,
    isSeeking,
    setIsSeeking,
    volume,
    isMuted,
    playbackRate,
    isShuffle,
    repeatMode,
    isAudioControlsOpen,
    isQueueDrawerOpen,
    isSleepTimerActive,
    setIsSleepTimerModalOpen,
    openTrackInfo,
    togglePlay,
    seek,
    setIsExpandedPlayerOpen,
    setIsAudioControlsOpen,
    setIsQueueDrawerOpen,
    eqPreset,
    effects,
    markers,
    jumpToMarker,
    loopAB,
    currentView,
    queue,
    queueIndex,
    toggleFavorite,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleShuffle,
    cycleRepeat,
    nextTrack,
    prevTrack,
  } = useMusic();

  const {
    isInRoom,
    isOwner,
    isLocallySilenced,
    roomTogglePlay,
    roomNext,
    roomPrev,
    roomSeek,
  } = useListenTogether();

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu reliably when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  const isAudioEffectActive = 
    eqPreset !== 'flat' || 
    Boolean(effects?.reverb?.enabled) || 
    Boolean(effects?.echo?.enabled) || 
    Boolean(effects?.saturation?.enabled) || 
    (effects?.bassBoost ?? 0) > 0 || 
    (effects?.trebleBoost ?? 0) > 0;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isRadio = currentTrack?.source === 'radio';
  const isUnknownDuration = !isRadio && (isNaN(duration) || duration <= 0);
  const upcomingCount = Math.max(0, queue.length - (queueIndex + 1));

  // Hide bottom player inside Listen Together dedicated view
  if (currentView === 'listen-together') {
    return null;
  }

  // --- EMPTY PLAYER STATE ---
  if (!currentTrack) {
    return (
      <div 
        id="bottom-player-bar" 
        className="hidden lg:flex fixed bottom-0 left-0 right-0 h-22 bg-[#090b10]/92 backdrop-blur-2xl z-40 px-6 sm:px-8 items-center justify-between select-none shadow-[0_-12px_40px_rgba(0,0,0,0.85)]"
      >
        {/* Left: Quiescent Identifier */}
        <div className="flex items-center gap-3.5 w-1/4 min-w-[210px] max-w-[320px]">
          <SolidCard variant="milled" className="w-12 h-12 flex items-center justify-center text-zinc-400 shrink-0">
            <Disc className="w-5 h-5 opacity-60 animate-spin" style={{ animationDuration: '12s' }} />
          </SolidCard>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-zinc-200 font-ui-title truncate">Space is quiescent</h4>
            <p className="text-[11px] text-zinc-400 font-ui-meta mt-0.5 truncate">Select a track to begin listening</p>
          </div>
        </div>

        {/* Center: Inactive Transport */}
        <div className="flex items-center justify-center gap-3 opacity-35 pointer-events-none">
          <Shuffle className="w-4 h-4 text-zinc-400" />
          <SkipBack className="w-4.5 h-4.5 text-zinc-400 fill-current" />
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-zinc-400">
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          </div>
          <SkipForward className="w-4.5 h-4.5 text-zinc-400 fill-current" />
          <Repeat className="w-4 h-4 text-zinc-400" />
        </div>

        {/* Right: Operational Utilities */}
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[190px]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-xl text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="w-20">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Volume slider"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsQueueDrawerOpen(!isQueueDrawerOpen)}
            className="p-2 rounded-xl text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIVE PLAYING STATE ---
  return (
    <div
      id="bottom-player-bar"
      className="hidden lg:flex fixed bottom-0 left-0 right-0 h-22 bg-[#090b10]/92 backdrop-blur-2xl z-40 px-6 sm:px-8 items-center justify-between select-none shadow-[0_-12px_40px_rgba(0,0,0,0.85)]"
    >
      {/* -------------------------------------------------------------
          ZONE 1 — TRACK IDENTITY (25% Width, min-w-[210px])
          ------------------------------------------------------------- */}
      <div className="flex items-center gap-3 w-1/4 min-w-[210px] max-w-[320px]">
        <SolidCard
          variant="elevated"
          interactive
          onClick={() => setIsExpandedPlayerOpen(true)}
          className="relative group shrink-0 w-12 h-12 overflow-hidden cursor-pointer rounded-xl border-white/10"
        >
          {currentTrack.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${currentTrack.coverColor || 'from-zinc-800 to-zinc-950'} flex items-center justify-center`}>
              <Music className="w-5 h-5 text-white/80" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 className="w-3.5 h-3.5 text-white" />
          </div>
        </SolidCard>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 
              onClick={() => setIsExpandedPlayerOpen(true)}
              className="text-xs sm:text-sm font-semibold text-white truncate hover:underline cursor-pointer font-ui-title"
              title={currentTrack.title}
            >
              {currentTrack.title}
            </h4>

            <TelemetryBadge 
              variant={currentTrack.source === 'youtube' && isDirectStreamActive ? 'emerald' : 'glass'}
              size="sm"
              dot={isDirectStreamActive}
              dotPulse={isDirectStreamActive}
              className="shrink-0 text-[8px]"
            >
              {currentTrack.source === 'youtube' && isDirectStreamActive
                ? 'YT DIRECT'
                : (currentTrack.source || 'LOCAL').toUpperCase()}
            </TelemetryBadge>
          </div>

          <p className="text-[11px] text-zinc-300/80 truncate mt-0.5 font-ui-meta" title={currentTrack.artist}>
            {currentTrack.artist}
          </p>
        </div>

        <button
          type="button"
          onClick={() => toggleFavorite(currentTrack.id)}
          aria-label={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="p-2 rounded-xl text-zinc-300 hover:text-rose-400 hover:bg-white/[0.08] transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''
            }`}
          />
        </button>
      </div>

      {/* -------------------------------------------------------------
          ZONE 2 — PLAYBACK CONTROLS & TIMELINE (Center Flex-1)
          ------------------------------------------------------------- */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-xl px-2 gap-1.5">
        
        {/* Transport Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label={`Shuffle ${isShuffle ? 'On' : 'Off'}`}
            className={`p-2 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
              isShuffle ? 'text-white bg-white/15 border border-white/20' : 'text-zinc-300 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={isInRoom ? roomPrev : prevTrack}
            aria-label="Previous Track"
            className="p-2 text-zinc-200 hover:text-white rounded-xl hover:bg-white/[0.08] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <TactileButton
            variant="primary"
            size="icon"
            onClick={isInRoom ? roomTogglePlay : togglePlay}
            aria-label={isPlaying && !isLocallySilenced ? 'Pause' : 'Play'}
            className="w-10 h-10 rounded-full shadow-lg"
          >
            {isPlaying && !isLocallySilenced ? (
              <Pause className="w-4 h-4 fill-current text-black" />
            ) : (
              <Play className="w-4 h-4 fill-current text-black translate-x-0.5" />
            )}
          </TactileButton>

          <button
            type="button"
            onClick={isInRoom ? roomNext : nextTrack}
            aria-label="Next Track"
            className="p-2 text-zinc-200 hover:text-white rounded-xl hover:bg-white/[0.08] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={cycleRepeat}
            aria-label={`Repeat ${repeatMode}`}
            className={`p-2 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
              repeatMode !== 'off' ? 'text-white bg-white/15 border border-white/20' : 'text-zinc-300 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Source-Aware Timeline */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-300/90 w-9 text-right shrink-0">
            {formatTime(currentTime)}
          </span>

          <div className="flex-1 flex items-center justify-center min-w-0">
            {isRadio ? (
              <div className="w-full h-5 flex items-center justify-center bg-white/[0.04] rounded-lg border border-white/[0.08] px-3">
                <TelemetryBadge variant="emerald" size="sm" dot dotPulse>
                  LIVE BROADCAST STREAM
                </TelemetryBadge>
              </div>
            ) : isUnknownDuration ? (
              <div className="w-full h-5 flex items-center justify-center bg-white/[0.04] rounded-lg border border-white/[0.08] px-3">
                <span className="text-[10px] font-mono text-zinc-400">DIRECT AUDIO STREAM</span>
              </div>
            ) : (
              <WaveformScrubber
                peaks={currentTrack.waveformPeaks}
                currentTime={currentTime}
                duration={duration}
                onSeek={isInRoom ? roomSeek : seek}
                onSeekingChange={setIsSeeking}
                height={18}
                barWidth={2}
                barGap={1.5}
                activeColor="#ffffff"
                inactiveColor="rgba(255, 255, 255, 0.16)"
                showHoverTime={true}
                markers={markers}
                onMarkerClick={jumpToMarker}
                loopRegion={{
                  pointA: loopAB.pointA,
                  pointB: loopAB.pointB,
                  enabled: loopAB.enabled,
                }}
              />
            )}
          </div>

          <span className="text-[10px] font-mono text-zinc-400 w-9 text-left shrink-0">
            {isRadio || isUnknownDuration ? '--:--' : formatTime(duration)}
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------
          ZONE 3 — AUDIO UTILITIES (25% Width, min-w-[190px])
          ------------------------------------------------------------- */}
      <div className="flex items-center justify-end gap-2 w-1/4 min-w-[190px]">
        
        {/* Volume Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <div className="hidden lg:block w-20">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
              aria-label="Volume slider"
            />
          </div>
        </div>

        {/* Queue Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsQueueDrawerOpen(!isQueueDrawerOpen)}
          aria-label="Toggle Queue"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
            isQueueDrawerOpen
              ? 'bg-white/15 text-white border border-white/20'
              : 'text-zinc-300 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          {upcomingCount > 0 && (
            <span className="text-[10px] font-mono text-zinc-300 font-medium">
              {upcomingCount}
            </span>
          )}
        </button>

        {/* Contextual More Actions Dropdown */}
        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            aria-label="More Options"
            className={`p-2 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
              showMoreMenu
                ? 'bg-white/15 text-white border border-white/20'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute bottom-full mb-3 right-0 w-64 p-2 rounded-2xl bg-[#12141d]/96 backdrop-blur-2xl border border-white/12 shadow-[0_24px_50px_rgba(0,0,0,0.95)] flex flex-col gap-1 z-50 text-left animate-in fade-in duration-150">
              
              {/* Playback Speed Row */}
              <div className="px-2.5 py-2 flex items-center justify-between border-b border-white/[0.08] mb-0.5">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">Speed</span>
                <div className="flex items-center gap-1">
                  {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPlaybackRate(rate)}
                      className={`px-1.5 py-0.5 text-[10px] font-mono rounded-md transition-colors cursor-pointer ${
                        Math.abs(playbackRate - rate) < 0.01
                          ? 'bg-white text-black font-bold shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {rate}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Rows with Aligned Icon Column */}
              <button
                type="button"
                onClick={() => {
                  setIsAudioControlsOpen(!isAudioControlsOpen);
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer group"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="flex-1 truncate">Audio Studio & DSP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSleepTimerModalOpen(true);
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer group"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="flex-1 truncate font-ui-body">Sleep Timer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  openTrackInfo(currentTrack);
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer group"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="flex-1 truncate font-ui-body">Track Metadata Info</span>
              </button>

              <div className="my-0.5 border-t border-white/[0.08]" />

              <button
                type="button"
                onClick={() => {
                  setIsExpandedPlayerOpen(true);
                  setShowMoreMenu(false);
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-colors text-left cursor-pointer group"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Maximize2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="flex-1 truncate font-ui-body">Expand Studio Canvas</span>
              </button>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
