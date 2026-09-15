import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { useListenTogether } from '../../context/ListenTogetherContext';
import { WaveformScrubber } from '../waveform/WaveformScrubber';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  RotateCw, 
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
  Users,
} from 'lucide-react';

export const BottomPlayer: React.FC = () => {
  const {
    currentTrack,
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
    setIsExpandedPlayerOpen,
    setIsAudioControlsOpen,
    setIsQueueDrawerOpen,
    eqPreset,
    effects,
    markers,
    jumpToMarker,
    loopAB,
    currentView,
    setCurrentView,
    showToast,
  } = useMusic();

  const {
    isInRoom,
    activeRoom,
    participants,
    isOwner,
    isLocallySilenced,
    togglePersonalSilence,
    roomTogglePlay,
    roomNext,
    roomPrev,
    roomSeek,
  } = useListenTogether();

  const handleSeekRelative = (delta: number) => {
    if (isInRoom) {
      if (!isOwner) {
        showToast('Only the host can seek backward or forward.', 'info');
        return;
      }
      roomSeek(currentTime + delta);
      return;
    }
    seekRelative(delta);
  };

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Check if any audio shaping is active
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

  // When inside the Listen Together view, the dedicated room player is already active
  if (currentView === 'listen-together') {
    return null;
  }

  if (!currentTrack) {
    return (
      <div 
        id="bottom-player-bar" 
        className="hidden lg:flex fixed bottom-0 left-0 right-0 h-20 bg-[#08090d]/90 border-t border-white/5 backdrop-blur-2xl z-40 px-4 sm:px-8 items-center justify-between select-none"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#0e1017] border border-white/5 flex items-center justify-center text-zinc-600">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-300">Space is quiescent</p>
            <p className="text-[11px] text-zinc-500">Select any track or load demo pack</p>
          </div>
        </div>

        <button
          onClick={togglePlay}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Begin Audio
        </button>
      </div>
    );
  }

  return (
    <div
      id="bottom-player-bar"
      className="hidden lg:flex fixed bottom-0 left-0 right-0 h-20 bg-[#0c0e14] border-t border-white/[0.08] z-40 px-4 sm:px-8 flex-col justify-center select-none shadow-2xl"
    >
      {/* Top subtle structural hairline */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/[0.06] pointer-events-none" />

      <div className="flex items-center justify-between gap-4 w-full max-w-7xl mx-auto">
        
        {/* Left: Track Object & Typography */}
        <div className="flex items-center gap-3.5 min-w-0 w-1/4">
          <div
            onClick={() => setIsExpandedPlayerOpen(true)}
            className="relative group cursor-pointer shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-white/10 shadow bg-[#12141c]"
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
            
            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsExpandedPlayerOpen(true);
                }
              }}
              onClick={() => setIsExpandedPlayerOpen(true)}
              className="text-left w-full block group cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">
                  {currentTrack.title}
                </h4>
                {currentTrack.source === 'youtube' && (
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-300 border border-white/10 shrink-0">
                    YouTube
                  </span>
                )}
                {currentTrack.source === 'audius' && (
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-300 border border-white/10 shrink-0">
                    Audius
                  </span>
                )}
                {isInRoom && activeRoom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentView('listen-together');
                    }}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-zinc-300 text-[10px] font-mono hover:bg-white/[0.1] transition-colors cursor-pointer shrink-0"
                    title="In Listen Together Room. Click to view room."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="truncate max-w-[110px]">Room: {activeRoom.roomName}</span>
                    <span className="text-zinc-500">({participants.length})</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5 group-hover:text-zinc-300">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleFavorite(currentTrack.id)}
            title={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Center: Playback Controls & Waveform Timeline */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-xl gap-1">
          {/* Controls Row */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isShuffle ? 'text-white bg-white/10 border border-white/10' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            {/* Seek Back 10s */}
            <button
              onClick={() => handleSeekRelative(-10)}
              title={isInRoom && !isOwner ? 'Only room host can seek' : 'Rewind 10s (←)'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer hidden md:block ${
                isInRoom && !isOwner ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Previous */}
            <button
              onClick={isInRoom ? roomPrev : prevTrack}
              title="Previous (P)"
              className="p-1.5 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Signature AURA Play / Pause Button */}
            <button
              onClick={isInRoom ? roomTogglePlay : togglePlay}
              title={isPlaying && !isLocallySilenced ? 'Pause (Space)' : 'Play (Space)'}
              className="p-2.5 rounded-full text-zinc-950 bg-white hover:bg-zinc-200 active:scale-95 transition-all duration-150 shadow-md cursor-pointer"
            >
              {isPlaying && !isLocallySilenced ? (
                <Pause className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={isInRoom ? roomNext : nextTrack}
              title="Next (N)"
              className="p-1.5 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            {/* Seek Forward 10s */}
            <button
              onClick={() => handleSeekRelative(10)}
              title={isInRoom && !isOwner ? 'Only room host can seek' : 'Forward 10s (→)'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer hidden md:block ${
                isInRoom && !isOwner ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Repeat */}
            <button
              onClick={cycleRepeat}
              title={`Repeat: ${repeatMode}`}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                repeatMode !== 'off' ? 'text-white bg-white/10 border border-white/10' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Waveform Scrubber & Timestamps */}
          <div className="w-full flex items-center gap-2.5">
            <span className="text-[10px] font-mono text-zinc-400 w-8 text-right shrink-0">
              {formatTime(currentTime)}
            </span>

            <div className="flex-1">
              <WaveformScrubber
                peaks={currentTrack.waveformPeaks}
                currentTime={currentTime}
                duration={duration}
                onSeek={isInRoom ? roomSeek : seek}
                onSeekingChange={setIsSeeking}
                height={20}
                barWidth={2}
                barGap={1.5}
                activeColor="#ffffff"
                inactiveColor="rgba(255, 255, 255, 0.14)"
                showHoverTime={true}
                markers={markers}
                onMarkerClick={jumpToMarker}
                loopRegion={{
                  pointA: loopAB.pointA,
                  pointB: loopAB.pointB,
                  enabled: loopAB.enabled,
                }}
              />
            </div>

            <span className="text-[10px] font-mono text-zinc-500 w-8 text-left shrink-0">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Studio Controls, Queue, Speed, Volume, Fullscreen */}
        <div className="flex items-center justify-end gap-2 w-1/4">
          
          {/* Speed Selector Popup */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              title="Playback Speed"
              className="px-2 py-1 text-[11px] font-mono font-medium rounded-lg text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
            >
              {playbackRate}×
            </button>

            {showSpeedMenu && (
              <div 
                className="absolute bottom-full mb-2 right-0 p-1.5 rounded-xl bg-[#141720] border border-white/[0.08] shadow-2xl flex flex-col gap-1 z-50 min-w-[75px]"
                onMouseLeave={() => setShowSpeedMenu(false)}
              >
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-2.5 py-1 text-xs font-mono text-left rounded-md transition-colors cursor-pointer ${
                      Math.abs(playbackRate - rate) < 0.01
                        ? 'bg-white text-zinc-950 font-semibold'
                        : 'text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    {rate}×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Track Metadata Inspector */}
          <button
            onClick={() => currentTrack && openTrackInfo(currentTrack)}
            title="Track Info & Metadata"
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Sleep Timer Button */}
          <button
            onClick={() => setIsSleepTimerModalOpen(true)}
            title={isSleepTimerActive ? `Sleep Timer Active (${sleepTimerRemainingSecs ? Math.ceil(sleepTimerRemainingSecs/60) + 'm left' : 'End of track'})` : 'Sleep Timer'}
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              isSleepTimerActive
                ? 'text-white bg-white/10 border border-white/15'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Moon className="w-4 h-4" />
            {isSleepTimerActive && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>

          {/* Audio Controls & EQ Studio Drawer Toggle */}
          <button
            onClick={() => setIsAudioControlsOpen(!isAudioControlsOpen)}
            title={
              currentTrack?.source === 'youtube'
                ? 'Audio Studio (Basic controls active; DSP effects apply to local audio files)'
                : 'Audio Studio & Parametric EQ (E)'
            }
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              isAudioControlsOpen || (isAudioEffectActive && currentTrack?.source !== 'youtube')
                ? 'text-white bg-white/10 border border-white/15'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {isAudioEffectActive && currentTrack?.source !== 'youtube' && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </button>

          {/* Queue Drawer Toggle */}
          <button
            onClick={() => setIsQueueDrawerOpen(!isQueueDrawerOpen)}
            title="Up Next Queue (Q)"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isQueueDrawerOpen
                ? 'text-white bg-white/10 border border-white/15'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="relative flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
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

          {/* Fullscreen Studio Modal */}
          <button
            onClick={() => setIsExpandedPlayerOpen(true)}
            title="Open Studio Atmosphere (F)"
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
