import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useMusic } from '../../context/MusicContext';
import { WaveformScrubber } from '../waveform/WaveformScrubber';
import { AudioVisualizer } from '../visualizer/AudioVisualizer';
import { AuraBrandMark } from '../common/AuraBrandMark';
import { useMotionCapabilities } from '../../motion/useMotionCapabilities';
import {
  dialogVariants,
  fadeVariants,
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_TRANSITION,
  REDUCED_FADE_TRANSITION,
} from '../../motion/tokens';
import {
  MotionArtwork,
  MotionFadeSlide,
  MotionIconSwap,
  MotionPress,
} from '../common/motion';
import { 
  X, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Heart, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  RotateCw, 
  SlidersHorizontal, 
  Sparkles, 
  Activity, 
  Music, 
  Info, 
  Moon,
  ListMusic,
  ChevronUp,
  ChevronDown,
  Trash2,
  PanelRightClose,
  PanelRightOpen,
  BarChart3,
  Disc3,
  Radio,
  Youtube,
  HardDrive
} from 'lucide-react';
import { MobileExpandedPlayer } from '../mobile/MobileExpandedPlayer';
import { useListenTogether } from '../../context/ListenTogetherContext';
import { VisualizerMode } from '../../types';

export const ExpandedPlayer: React.FC = () => {
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
    isExpandedPlayerOpen,
    setIsExpandedPlayerOpen,
    isSleepTimerActive,
    sleepTimerRemainingSecs,
    setIsSleepTimerModalOpen,
    openTrackInfo,
    togglePlay,
    seek,
    seekRelative,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleShuffle,
    cycleRepeat,
    toggleFavorite,
    visualizerMode,
    setVisualizerMode,
    showToast,
    queue,
    setQueue,
    queueIndex,
    playTrack,
    removeFromQueue,
    reorderQueue,
    setIsAudioControlsOpen,
  } = useMusic();

  const {
    isInRoom,
    activeRoom,
    participants,
    isOwner,
    isLocallySilenced,
    roomTogglePlay,
    roomNext,
    roomPrev,
    roomSeek,
  } = useListenTogether();

  const { prefersReducedMotion, sharedTransition } = useMotionCapabilities();
  const [isQueueCollapsed, setIsQueueCollapsed] = useState(false);

  // Up Next tracks list (tracks strictly following current queue index)
  const upNextTracks = useMemo(() => {
    if (queueIndex < 0 || queueIndex >= queue.length) return [];
    return queue.slice(queueIndex + 1);
  }, [queue, queueIndex]);

  const handleSeek = (pos: number) => {
    if (isInRoom) {
      if (!isOwner) {
        showToast('Only the room host can seek the track.', 'info');
        return;
      }
      roomSeek(pos);
      return;
    }
    seek(pos);
  };

  const handleSeekRelative = (delta: number) => {
    if (isInRoom) {
      if (!isOwner) {
        showToast('Only the room host can seek backward or forward.', 'info');
        return;
      }
      roomSeek(currentTime + delta);
      return;
    }
    seekRelative(delta);
  };

  const handleMoveTrack = (relativeIndex: number, direction: 'up' | 'down') => {
    const actualIndex = queueIndex + 1 + relativeIndex;
    const targetActualIndex = direction === 'up' ? actualIndex - 1 : actualIndex + 1;
    if (direction === 'up' && targetActualIndex <= queueIndex) return;
    if (direction === 'down' && targetActualIndex >= queue.length) return;
    reorderQueue(actualIndex, targetActualIndex);
  };

  const handleRemoveTrack = (relativeIndex: number) => {
    const actualIndex = queueIndex + 1 + relativeIndex;
    removeFromQueue(actualIndex);
    showToast('Removed from queue', 'info');
  };

  const handleClearUpcoming = () => {
    if (upNextTracks.length === 0) return;
    setQueue((prev) => prev.slice(0, queueIndex + 1));
    showToast('Upcoming queue cleared', 'info');
  };

  const handleShuffleUpcoming = () => {
    if (upNextTracks.length <= 1) return;
    setQueue((prev) => {
      const preserved = prev.slice(0, queueIndex + 1);
      const upcoming = [...prev.slice(queueIndex + 1)];
      for (let i = upcoming.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
      }
      return [...preserved, ...upcoming];
    });
    showToast('Upcoming queue shuffled', 'info');
  };

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSourceBadge = () => {
    switch (currentTrack.source) {
      case 'local':
        return { label: 'Local Audio', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'audius':
        return { label: 'Audius Catalog', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case 'jamendo':
        return { label: 'Jamendo Music', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'youtube':
        return { 
          label: isDirectStreamActive ? 'YouTube Direct' : 'YouTube Audio', 
          color: 'text-red-400 bg-red-500/10 border-red-500/20' 
        };
      case 'radio':
      case 'radiobrowser':
        return { label: 'Live Radio', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
      default:
        return { label: 'AURA Audio', color: 'text-zinc-400 bg-white/5 border-white/10' };
    }
  };

  const sourceBadge = getSourceBadge();

  return (
    <>
      {/* Mobile Dedicated Expanded Player */}
      <MobileExpandedPlayer />

      {/* Desktop Expanded Now Playing Experience */}
      <AnimatePresence>
        {isExpandedPlayerOpen && (
          <motion.div
            key="desktop-expanded-player"
            id="expanded-player-modal"
            variants={prefersReducedMotion ? fadeVariants : dialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ pointerEvents: isExpandedPlayerOpen ? 'auto' : 'none' }}
            className="hidden lg:flex fixed inset-0 z-50 bg-[#06070a]/98 backdrop-blur-3xl overflow-y-auto flex-col justify-between p-6 sm:p-8 select-none relative"
          >
            {/* Full-bleed Ambient Artwork Canvas Behind the Sanctuary */}
            <AnimatePresence initial={false}>
              {currentTrack.coverUrl && (
                <motion.div
                  key={`desktop-ambient-${currentTrack.coverUrl}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={prefersReducedMotion ? REDUCED_FADE_TRANSITION : MOTION_TRANSITION.emphasized}
                  className="absolute inset-0 pointer-events-none -z-10 overflow-hidden"
                >
                  <img
                    src={currentTrack.coverUrl}
                    alt=""
                    className="w-full h-full object-cover blur-[90px] opacity-25 scale-125 filter brightness-75"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-[#06070a]/80 to-[#06070a]/90" />
                </motion.div>
              )}
            </AnimatePresence>
            {/* -------------------------------------------------------------
                TOP BAR NAVIGATION
                ------------------------------------------------------------- */}
            <div className="flex items-center justify-between w-full max-w-7xl mx-auto pb-4 border-b border-white/[0.08] shrink-0">
              <div className="flex items-center gap-3">
                <AuraBrandMark size={24} isPlaying={isPlaying} />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-300">
                    NOW PLAYING
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${sourceBadge.color}`}>
                    {sourceBadge.label}
                  </span>
                  {currentTrack.fileFormat && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 font-mono border border-white/[0.06]">
                      {currentTrack.fileFormat} {currentTrack.fileSize ? `• ${formatBytes(currentTrack.fileSize)}` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Center Room Status (if active in Listen Together) */}
              {isInRoom && activeRoom && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-300 font-mono">
                    Room: {activeRoom.roomName}
                  </span>
                  <span className="text-zinc-500 text-xs">•</span>
                  <span className="text-[11px] text-zinc-400">
                    {participants.length} listening {isOwner ? '(Host)' : ''}
                  </span>
                </div>
              )}

              {/* Top Right Quick Actions */}
              <div className="flex items-center gap-2">
                {/* Quick Audio DSP Studio */}
                <MotionPress
                  onClick={() => setIsAudioControlsOpen(true)}
                  intensity="subtle"
                  enableHoverScale
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] text-xs font-medium transition-colors cursor-pointer"
                  title="Open Audio Studio (10-Band EQ, Effects & Dynamics)"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Audio Studio</span>
                </MotionPress>

                {/* Queue Collapse / Expand Toggle */}
                <MotionPress
                  onClick={() => setIsQueueCollapsed(!isQueueCollapsed)}
                  intensity="subtle"
                  enableHoverScale
                  className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] text-xs font-medium transition-colors cursor-pointer"
                  title={isQueueCollapsed ? 'Show Up Next Queue' : 'Collapse Up Next Queue'}
                >
                  <MotionIconSwap stateKey={isQueueCollapsed ? 'open' : 'close'}>
                    {isQueueCollapsed ? (
                      <PanelRightOpen className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <PanelRightClose className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </MotionIconSwap>
                  <span>{isQueueCollapsed ? 'Show Queue' : 'Hide Queue'}</span>
                </MotionPress>

                {/* Sleep Timer */}
                <MotionPress
                  onClick={() => setIsSleepTimerModalOpen(true)}
                  intensity="control"
                  enableHoverScale
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    isSleepTimerActive
                      ? 'text-white bg-white/10 border-white/20'
                      : 'text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06]'
                  }`}
                  title={isSleepTimerActive ? `Sleep Timer Active (${sleepTimerRemainingSecs ? Math.ceil(sleepTimerRemainingSecs / 60) + 'm left' : 'End of track'})` : 'Set Sleep Timer'}
                >
                  <Moon className="w-4 h-4" />
                </MotionPress>

                {/* Close / Minimize Button */}
                <MotionPress
                  onClick={() => setIsExpandedPlayerOpen(false)}
                  intensity="control"
                  enableHoverScale
                  className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors cursor-pointer"
                  title="Minimize Player (Esc)"
                >
                  <X className="w-4 h-4" />
                </MotionPress>
              </div>
            </div>

        {/* -------------------------------------------------------------
            MAIN BODY — THREE BALANCED AREAS
            1. Left: Track Identity Anchor
            2. Centre: Playback Experience (Visualizer, Scrubber, Master Controls)
            3. Right: Listening Context (Up Next Queue)
            ------------------------------------------------------------- */}
        <div className="w-full max-w-7xl mx-auto my-auto py-6 grid grid-cols-12 gap-8 items-center flex-1">
          
          {/* AREA 1: LEFT TRACK IDENTITY ANCHOR */}
          <div className={`${isQueueCollapsed ? 'col-span-4' : 'col-span-4 xl:col-span-4'} flex flex-col items-center xl:items-start text-center xl:text-left`}>
            {/* Large Album Artwork with Ambient Refraction Halo */}
            <div className="relative group w-72 h-72 sm:w-80 sm:h-80 xl:w-84 xl:h-84 flex items-center justify-center">
              {/* Sound-reactive soft ambient halo */}
              <AnimatePresence>
                {currentTrack.coverUrl && isPlaying && (
                  <motion.div
                    key={`halo-${currentTrack.coverUrl}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.55 }}
                    exit={{ opacity: 0 }}
                    transition={prefersReducedMotion ? REDUCED_FADE_TRANSITION : MOTION_TRANSITION.emphasized}
                    className="absolute -inset-3 rounded-3xl scale-110 pointer-events-none -z-10"
                    style={{
                      backgroundImage: `url(${currentTrack.coverUrl})`,
                      backgroundSize: 'cover',
                      filter: 'blur(50px)',
                    }}
                  />
                )}
              </AnimatePresence>

              <motion.div
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { scale: isPlaying && !isLocallySilenced ? 1.02 : 1 }
                }
                transition={sharedTransition}
                className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.9)] border border-white/25 bg-[#0d1017] flex items-center justify-center"
              >
                <AnimatePresence initial={false}>
                  <MotionArtwork
                    key={`${currentTrack.id}:${currentTrack.coverUrl || ''}`}
                    artworkKey={`${currentTrack.id}:${currentTrack.coverUrl || ''}`}
                    className="absolute inset-0 w-full h-full"
                  >
                    {currentTrack.coverUrl ? (
                      <img
                        src={currentTrack.coverUrl}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${currentTrack.coverColor || 'from-[#141a29] to-[#080b12]'} flex flex-col items-center justify-center p-6 text-white`}>
                        <Music className="w-16 h-16 opacity-30 mb-3" />
                        <span className="text-xs font-mono tracking-widest opacity-40 uppercase font-semibold">
                          AURA AUDIO
                        </span>
                      </div>
                    )}
                  </MotionArtwork>
                </AnimatePresence>

                {/* Source Attribution Tag */}
                <div className="absolute top-3 left-3 z-10">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg backdrop-blur-md border ${sourceBadge.color}`}>
                    {sourceBadge.label}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Track Metadata */}
            <div className="mt-5 w-full max-w-sm">
              <AnimatePresence mode="wait" initial={false}>
                <MotionFadeSlide
                  key={currentTrack.id}
                  direction="up"
                  distance={4}
                  duration="micro"
                >
                  <h2 className="text-2xl font-page-title text-white tracking-tight leading-tight line-clamp-2">
                    {currentTrack.title}
                  </h2>
                  <p className="text-sm font-artist-name text-zinc-300 mt-1 truncate">
                    {currentTrack.artist}
                  </p>
                  {currentTrack.album && currentTrack.album !== 'YouTube Stream' && currentTrack.album !== 'Audius Stream' && (
                    <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate">
                      {currentTrack.album}
                    </p>
                  )}
                </MotionFadeSlide>
              </AnimatePresence>

              {/* Action Toolbar */}
              <div className="flex items-center justify-center xl:justify-start gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                <MotionPress
                  onClick={() => toggleFavorite(currentTrack.id)}
                  intensity="control"
                  enableHoverScale
                  aria-label={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  aria-pressed={Boolean(currentTrack.isFavorite)}
                  className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                    currentTrack.isFavorite
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border-white/[0.06]'
                  }`}
                  title={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <motion.span
                    key={`${currentTrack.id}:${Boolean(currentTrack.isFavorite)}`}
                    className="inline-flex items-center justify-center"
                    initial={false}
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : { scale: currentTrack.isFavorite ? [1, 1.24, 1] : [1, 0.9, 1] }
                    }
                    transition={{ duration: MOTION_DURATION.standard, ease: MOTION_EASE.emphasized }}
                  >
                    <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-current' : ''}`} />
                  </motion.span>
                </MotionPress>

                <MotionPress
                  onClick={() => currentTrack && openTrackInfo(currentTrack)}
                  intensity="control"
                  enableHoverScale
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
                  title="Track Details & Metadata (I)"
                >
                  <Info className="w-4 h-4" />
                </MotionPress>

                {currentTrack.genre && (
                  <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-white/[0.03] text-zinc-400 border border-white/[0.05] truncate max-w-[120px]">
                    {currentTrack.genre}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* AREA 2: CENTRE PLAYBACK & ANALYZER EXPERIENCE (Precise, refined & technically legible) */}
          <div className={`${isQueueCollapsed ? 'col-span-8' : 'col-span-8 xl:col-span-5'} flex flex-col justify-between h-full py-2 gap-4`}>
            
            {/* Real-time Spectrum / Waveform Visualizer Canvas */}
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-[rgba(10,13,20,0.55)] border border-white/[0.06] backdrop-blur-xl shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono px-0.5">
                <span className="text-zinc-300 uppercase tracking-wider text-[10px] font-semibold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  Acoustic Analyzer
                </span>
                
                {/* Visualizer Mode Switcher */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <button
                    onClick={() => setVisualizerMode('spectrum')}
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono transition-colors ${
                      visualizerMode === 'spectrum' ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Spectrum
                  </button>
                  <button
                    onClick={() => setVisualizerMode('waveform')}
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono transition-colors ${
                      visualizerMode === 'waveform' ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Wave
                  </button>
                  <button
                    onClick={() => setVisualizerMode('circular')}
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono transition-colors ${
                      visualizerMode === 'circular' ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Radial
                  </button>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden bg-black/30 p-1.5">
                <AudioVisualizer
                  mode={visualizerMode}
                  onModeChange={setVisualizerMode}
                  height={175}
                  showControls={false}
                />
              </div>
            </div>

            {/* Precision Waveform Scrubber Timeline */}
            <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <WaveformScrubber
                peaks={currentTrack.waveformPeaks}
                currentTime={currentTime}
                duration={duration}
                onSeek={handleSeek}
                onSeekingChange={setIsSeeking}
                disabled={isInRoom && !isOwner}
                isRadio={currentTrack.source === 'radio' || currentTrack.source === 'radiobrowser'}
                isLoadingDuration={
                  currentTrack.source !== 'radio' &&
                  currentTrack.source !== 'radiobrowser' &&
                  (!Number.isFinite(duration) || duration <= 0) &&
                  isPlaying
                }
                variant="auto"
                height={42}
                barWidth={3}
                barGap={2}
                activeColor="#ffffff"
                inactiveColor="rgba(255, 255, 255, 0.14)"
              />

              <div className="flex items-center justify-between text-xs font-mono tabular-nums text-zinc-400 px-1">
                <span className="text-white font-medium">
                  {currentTrack.source === 'radio' || currentTrack.source === 'radiobrowser'
                    ? 'LIVE'
                    : formatTime(currentTime)}
                </span>
                <span className="text-[11px] text-zinc-400 font-sans">
                  {isInRoom && !isOwner
                    ? 'Only the room host can seek'
                    : currentTrack.source === 'radio' || currentTrack.source === 'radiobrowser'
                      ? 'Live broadcast stream'
                      : !Number.isFinite(duration) || duration <= 0
                        ? isPlaying
                          ? 'Loading track duration…'
                          : 'Duration unavailable'
                        : 'Click or drag timeline to scrub'}
                </span>
                <span>
                  {currentTrack.source === 'radio' || currentTrack.source === 'radiobrowser'
                    ? 'LIVE'
                    : !Number.isFinite(duration) || duration <= 0
                      ? '--:--'
                      : `-${formatTime(Math.max(0, duration - currentTime))}`}
                </span>
              </div>
            </div>

            {/* Master Controls Floating Glass Tray */}
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center gap-2.5 sm:gap-4 px-5 sm:px-6 py-2.5 rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/[0.10] shadow-lg">
                <MotionPress
                  onClick={toggleShuffle}
                  intensity="control"
                  enableHoverScale
                  aria-pressed={isShuffle}
                  className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                    isShuffle ? 'text-sky-300 bg-white/15 border border-white/20' : 'text-zinc-400 hover:text-white'
                  }`}
                  title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
                >
                  <Shuffle className="w-4 h-4" />
                </MotionPress>

                <MotionPress
                  onClick={() => handleSeekRelative(-10)}
                  intensity="control"
                  enableHoverScale={!isInRoom || isOwner}
                  className={`p-2.5 rounded-full transition-colors ${
                    isInRoom && !isOwner ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white cursor-pointer'
                  }`}
                  title={isInRoom && !isOwner ? 'Only room host can seek' : 'Rewind 10s'}
                >
                  <RotateCcw className="w-4 h-4" />
                </MotionPress>

                <MotionPress
                  onClick={isInRoom ? roomPrev : prevTrack}
                  intensity="control"
                  enableHoverScale
                  className="p-2.5 text-zinc-300 hover:text-white rounded-full transition-colors cursor-pointer"
                  title="Previous Track"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </MotionPress>

                {/* Prominent 64px Circular Play/Pause */}
                <MotionPress
                  onClick={isInRoom ? roomTogglePlay : togglePlay}
                  intensity="control"
                  enableHoverScale
                  className="w-16 h-16 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 flex items-center justify-center shadow-[0_0_36px_rgba(255,255,255,0.55)] transition-colors cursor-pointer shrink-0"
                  title={isPlaying && !isLocallySilenced ? 'Pause' : 'Play'}
                >
                  <MotionIconSwap stateKey={isPlaying && !isLocallySilenced ? 'pause' : 'play'}>
                    {isPlaying && !isLocallySilenced ? (
                      <Pause className="w-7 h-7 fill-current" />
                    ) : (
                      <Play className="w-7 h-7 fill-current translate-x-0.5" />
                    )}
                  </MotionIconSwap>
                </MotionPress>

                <MotionPress
                  onClick={isInRoom ? roomNext : nextTrack}
                  intensity="control"
                  enableHoverScale
                  className="p-2.5 text-zinc-300 hover:text-white rounded-full transition-colors cursor-pointer"
                  title="Next Track"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </MotionPress>

                <MotionPress
                  onClick={() => handleSeekRelative(10)}
                  intensity="control"
                  enableHoverScale={!isInRoom || isOwner}
                  className={`p-2.5 rounded-full transition-colors ${
                    isInRoom && !isOwner ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white cursor-pointer'
                  }`}
                  title={isInRoom && !isOwner ? 'Only room host can seek' : 'Forward 10s'}
                >
                  <RotateCw className="w-4 h-4" />
                </MotionPress>

                <MotionPress
                  onClick={cycleRepeat}
                  intensity="control"
                  enableHoverScale
                  aria-pressed={repeatMode !== 'off'}
                  className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                    repeatMode !== 'off' ? 'text-sky-300 bg-white/15 border border-white/20' : 'text-zinc-400 hover:text-white'
                  }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  <MotionIconSwap stateKey={repeatMode}>
                    {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                  </MotionIconSwap>
                </MotionPress>
              </div>
            </div>

            {/* Sub-Controls: Speed Pills & Master Volume */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-2xl glass-ambient border border-white/[0.12] shadow-sm">
              {/* Playback Speed Pills */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-400 mr-1 hidden sm:inline">Speed:</span>
                {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <MotionPress
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    intensity="subtle"
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                      Math.abs(playbackRate - rate) < 0.01
                        ? 'bg-white text-zinc-950 font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-white bg-white/[0.06]'
                    }`}
                  >
                    {rate}×
                  </MotionPress>
                ))}
              </div>

              {/* Master Volume */}
              <div className="flex items-center gap-2">
                <MotionPress
                  onClick={toggleMute}
                  intensity="control"
                  enableHoverScale
                  className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  <MotionIconSwap stateKey={isMuted || volume === 0 ? 'muted' : 'audible'}>
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </MotionIconSwap>
                </MotionPress>
                <div className="w-24">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full accent-white transition-[filter] duration-150 hover:brightness-110"
                  />
                </div>
                <span className="text-[11px] font-mono tabular-nums text-zinc-400 w-8 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

          </div>

          {/* AREA 3: RIGHT LISTENING CONTEXT (UP NEXT QUEUE) */}
          <AnimatePresence initial={false}>
            {!isQueueCollapsed && (
              <MotionFadeSlide
                key="desktop-up-next-panel"
                direction="right"
                distance={14}
                duration="surface"
                className="hidden xl:flex xl:col-span-3 flex-col h-[520px] rounded-3xl glass-ambient border border-white/[0.12] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.7)] overflow-hidden"
              >
              {/* Queue Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-mono font-medium uppercase tracking-wider text-zinc-300">
                    Up Next
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.06]">
                    {upNextTracks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {upNextTracks.length > 1 && (
                    <button
                      onClick={handleShuffleUpcoming}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      title="Shuffle upcoming tracks"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {upNextTracks.length > 0 && (
                    <button
                      onClick={handleClearUpcoming}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                      title="Clear upcoming queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Pinned Current Playing Track */}
              <div className="my-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shrink-0 relative">
                  <AnimatePresence initial={false}>
                    <MotionArtwork
                      key={`pinned-${currentTrack.id}:${currentTrack.coverUrl || ''}`}
                      artworkKey={`pinned-${currentTrack.id}:${currentTrack.coverUrl || ''}`}
                      className="absolute inset-0 w-full h-full"
                    >
                      {currentTrack.coverUrl ? (
                        <img src={currentTrack.coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <Music className="w-4 h-4" />
                        </div>
                      )}
                    </MotionArtwork>
                  </AnimatePresence>
                  {isPlaying && (
                    <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                    Playing Now
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {currentTrack.artist}
                  </p>
                </div>
              </div>

              {/* Upcoming Tracks Scrollable List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-1">
                {upNextTracks.length > 0 ? (
                  upNextTracks.map((track, idx) => (
                    <div
                      key={`${track.id}-${idx}`}
                      className="group flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/5 transition-all"
                    >
                      <div 
                        onClick={() => playTrack(track)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-white/5 relative">
                          {track.coverUrl ? (
                            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                              <Music className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-3 h-3 fill-white" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                            {track.title}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        {idx > 0 && (
                          <button
                            onClick={() => handleMoveTrack(idx, 'up')}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                        )}

                        {idx < upNextTracks.length - 1 && (
                          <button
                            onClick={() => handleMoveTrack(idx, 'down')}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={() => handleRemoveTrack(idx)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-white/10 transition-colors"
                          title="Remove from queue"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="my-auto py-8 text-center flex flex-col items-center justify-center gap-2 text-zinc-500">
                    <ListMusic className="w-8 h-8 opacity-40 mb-1" />
                    <p className="text-xs font-medium text-zinc-400">Queue is empty</p>
                    <p className="text-[11px] text-zinc-600 max-w-[180px]">
                      Add songs from your library, search, or open sources.
                    </p>
                  </div>
                )}
              </div>

              </MotionFadeSlide>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
