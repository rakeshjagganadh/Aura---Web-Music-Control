import React, { useState } from 'react';
import { useListenTogether } from '../../context/ListenTogetherContext';
import { useMusic } from '../../context/MusicContext';
import {
  Users,
  Radio,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Copy,
  Check,
  Share2,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  Music2,
  User,
  Activity,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Volume2
} from 'lucide-react';
import { formatSeconds } from '../../utils/formatTime';
import { Track } from '../../types';
import { UniversalSearchModal } from '../search/UniversalSearchModal';

export const ListenTogetherView: React.FC = () => {
  const {
    activeRoom,
    isInRoom,
    participants,
    activities,
    connectionStatus,
    backendType,
    userDisplayName,
    setUserDisplayName,
    isOwner,
    pendingJoinRoomId,
    setPendingJoinRoomId,
    createRoom,
    joinRoom,
    leaveRoom,
    copyInviteLink,
    shareInviteLink,
    roomTogglePlay,
    roomSeek,
    roomNext,
    roomPrev,
    roomAddTrack,
    roomRemoveTrack,
    roomPlayTrack,
  } = useListenTogether();

  const { currentTime, duration, showToast, setCurrentView } = useMusic();

  // Modal / Input states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(Boolean(pendingJoinRoomId));
  const [isAddMusicModalOpen, setIsAddMusicModalOpen] = useState(false);

  const [roomNameInput, setRoomNameInput] = useState('Late Night Vibes');
  const [joinCodeInput, setJoinCodeInput] = useState(pendingJoinRoomId || '');
  const [displayNameInput, setDisplayNameInput] = useState(userDisplayName);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scrubber drag state
  const [dragTime, setDragTime] = useState<number | null>(null);

  const handleCopyLink = async () => {
    const success = await copyInviteLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNameInput.trim()) return;

    try {
      setIsSubmitting(true);
      await createRoom(roomNameInput.trim());
      setIsCreateModalOpen(false);
    } catch {
      showToast('Could not create room. Please check connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = (joinCodeInput || pendingJoinRoomId || '').trim();
    if (!code) return;

    try {
      setIsSubmitting(true);
      const ok = await joinRoom(code, displayNameInput.trim());
      if (ok) {
        setIsJoinModalOpen(false);
        setPendingJoinRoomId(null);
      }
    } catch {
      showToast('Unable to join room.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for source badge styling
  const renderSourceBadge = (source?: string) => {
    switch (source) {
      case 'youtube':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
            YouTube
          </span>
        );
      case 'audius':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Audius
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            Stream
          </span>
        );
    }
  };

  // =========================================================================
  // VIEW 1: PREVIEW / JOIN ROOM PROMPT (when opening /listen/:roomId)
  // =========================================================================
  if (pendingJoinRoomId && !isInRoom) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[70vh] text-center select-none">
        <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-6 shadow-xl">
          <Users className="w-10 h-10" />
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold mb-2">
          Shared Listening Room
        </span>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight mb-3">
          Join Room #{pendingJoinRoomId}
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mb-8">
          You have been invited to a synchronized listening session. Listen to music together with friends in real time.
        </p>

        <form onSubmit={handleJoinSubmit} className="w-full max-w-sm flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-medium text-zinc-300">Your Display Name</label>
            <input
              type="text"
              required
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="e.g. Priya, Rakesh, Arjun"
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setPendingJoinRoomId(null);
                setCurrentView('home');
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Back to AURA
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !displayNameInput.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Joining Room...' : 'Join Room'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LANDING PAGE (Listen Together - Share a room. Pick a song. Listen in sync.)
  // =========================================================================
  if (!isInRoom || !activeRoom) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 lg:py-16 flex flex-col items-center text-center select-none">
        
        {/* Visual Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>Realtime Synchronized Audio</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
          Listen Together
        </h1>
        <p className="text-base lg:text-lg text-zinc-400 max-w-lg mb-10 leading-relaxed">
          Share a room. Pick a song. Listen in sync.
        </p>

        {/* Primary Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md justify-center mb-16">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create a Room</span>
          </button>

          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-zinc-400" />
            <span>Join a Room</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-[#0b0d13]/70 border border-white/[0.07] backdrop-blur-xl">
            <div className="p-2.5 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 w-fit mb-4">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Universal Sources</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mix YouTube videos, Audius decentralized tracks, and web streams into a single synchronized playlist.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0b0d13]/70 border border-white/[0.07] backdrop-blur-xl">
            <div className="p-2.5 rounded-xl bg-purple-600/15 text-purple-400 border border-purple-500/20 w-fit mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Zero-Latency Sync</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Server-authoritative state synchronization with automatic drift correction keeps everyone on the exact same beat.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0b0d13]/70 border border-white/[0.07] backdrop-blur-xl">
            <div className="p-2.5 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 w-fit mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1.5">Everyone Can Control</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Play, pause, skip, seek, and add music collaboratively without complicated permissions or account walls.
            </p>
          </div>
        </div>

        {/* Backend & Identity Bar */}
        <div className="mt-12 pt-6 border-t border-white/5 w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span>Listening as:</span>
            <input
              type="text"
              value={displayNameInput}
              onChange={(e) => {
                setDisplayNameInput(e.target.value);
                setUserDisplayName(e.target.value);
              }}
              className="bg-transparent border-b border-zinc-700 text-zinc-300 px-1 py-0.5 focus:border-indigo-400 focus:outline-none"
              title="Click to edit display name"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Engine: {backendType === 'supabase' ? 'Supabase Realtime Cloud' : 'AURA Direct WebSocket'}</span>
          </div>
        </div>

        {/* CREATE ROOM MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0e1017] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl text-left">
              <h2 className="text-lg font-bold text-white mb-1">Create Listening Room</h2>
              <p className="text-xs text-zinc-400 mb-5">
                Start a private shared music session with friends or your partner.
              </p>

              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-300">Room Name</label>
                  <input
                    type="text"
                    required
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                    placeholder="e.g. Late Night Vibes, Lo-Fi Study, Chill Sunday"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-300">Your Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="e.g. Rakesh, Priya"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs text-zinc-400">
                  <span>Who can control playback?</span>
                  <span className="font-semibold text-indigo-300">Everyone (V1)</span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !roomNameInput.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* JOIN ROOM MODAL */}
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0e1017] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl text-left">
              <h2 className="text-lg font-bold text-white mb-1">Join a Room</h2>
              <p className="text-xs text-zinc-400 mb-5">
                Enter the room code or invite link to synchronize with the session.
              </p>

              <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-300">Room Code</label>
                  <input
                    type="text"
                    required
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    placeholder="e.g. late-vibes-7x or ABC123"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 uppercase font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-300">Your Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="e.g. Priya, Arjun"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsJoinModalOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !joinCodeInput.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Connecting...' : 'Join Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // VIEW 3: ACTIVE ROOM VIEW (Synchronized Music Session)
  // =========================================================================
  const currentTrack = activeRoom.currentTrack;
  const isPlaying = activeRoom.isPlaying;
  const displayCurrentTime = dragTime !== null ? dragTime : currentTime;
  const currentDuration = currentTrack?.duration || duration || 0;
  const progressPercent = currentDuration > 0 ? (displayCurrentTime / currentDuration) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6 select-none">
      
      {/* 1. ROOM HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6 rounded-3xl bg-[#0b0c12]/80 border border-white/10 backdrop-blur-xl shadow-xl">
        
        {/* Left: Back / Title / Presence count */}
        <div className="flex items-center gap-4">
          <button
            onClick={leaveRoom}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Leave room"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
                {activeRoom.roomName}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                #{activeRoom.roomId}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{participants.length || 1} listening</span>
              </div>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Host: {activeRoom.ownerName}</span>
            </div>
          </div>
        </div>

        {/* Right: Copy Link & Share Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="py-2 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? 'Copied Link' : 'Copy Invite Link'}</span>
          </button>

          <button
            onClick={shareInviteLink}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors cursor-pointer"
            title="Share room"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={leaveRoom}
            className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition-colors cursor-pointer"
          >
            Leave
          </button>
        </div>
      </div>

      {/* 2. MAIN ROOM CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: NOW PLAYING & QUEUE (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* NOW PLAYING CARD */}
          <div className="p-6 rounded-3xl bg-[#0d0f18]/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-6">
            <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/5 pb-3">
              <span className="font-mono uppercase tracking-widest text-[10px] text-zinc-500 font-semibold">
                NOW PLAYING
              </span>
              <div className="flex items-center gap-2">
                {currentTrack?.source && renderSourceBadge(currentTrack.source)}
                <span className="text-[10px] font-mono text-zinc-500">
                  {connectionStatus === 'CONNECTED' ? '● Synced' : 'Reconnecting...'}
                </span>
              </div>
            </div>

            {/* Artwork & Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="relative w-28 h-28 lg:w-36 lg:h-36 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 shadow-lg group">
                {currentTrack?.coverUrl ? (
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-950/60 to-purple-950/40 text-indigo-400">
                    <Music2 className="w-12 h-12 stroke-1" />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                    <span className="flex items-end gap-1 h-5">
                      <span className="w-1 bg-indigo-400 animate-[bounce_1s_infinite_100ms] rounded-full h-4" />
                      <span className="w-1 bg-indigo-400 animate-[bounce_1s_infinite_300ms] rounded-full h-5" />
                      <span className="w-1 bg-indigo-400 animate-[bounce_1s_infinite_200ms] rounded-full h-3" />
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h2 className="text-xl lg:text-2xl font-bold text-white truncate mb-1">
                  {currentTrack?.title || 'No Track Playing'}
                </h2>
                <p className="text-sm text-zinc-400 truncate mb-3">
                  {currentTrack?.artist || 'Add a song to start listening together'}
                </p>

                {currentTrack && (
                  <div className="flex items-center gap-2 justify-center sm:justify-start text-xs font-mono text-zinc-500">
                    <span>{currentTrack.album || 'Single'}</span>
                    <span>•</span>
                    <span>{formatSeconds(currentTrack.duration)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scrubber Progress Bar */}
            <div className="flex flex-col gap-1.5 pt-2">
              <div
                className="relative h-2 rounded-full bg-white/10 overflow-hidden cursor-pointer group"
                onClick={(e) => {
                  if (!currentDuration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percent = Math.max(0, Math.min(1, clickX / rect.width));
                  roomSeek(percent * currentDuration);
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>{formatSeconds(displayCurrentTime)}</span>
                <span>{formatSeconds(currentDuration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <button
                onClick={() => roomPrev()}
                className="p-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Previous track"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={() => roomTogglePlay()}
                className="p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={() => roomNext()}
                className="p-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                title="Next track"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>

          {/* SHARED QUEUE (UP NEXT) */}
          <div className="p-6 rounded-3xl bg-[#0b0c12]/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Up Next</h3>
                <p className="text-xs text-zinc-400">
                  Shared queue • {activeRoom.queue.length} track{activeRoom.queue.length === 1 ? '' : 's'}
                </p>
              </div>

              <button
                onClick={() => setIsAddMusicModalOpen(true)}
                className="py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Music</span>
              </button>
            </div>

            {/* Queue List */}
            {activeRoom.queue.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3 text-zinc-500 border border-dashed border-white/10 rounded-2xl">
                <Music2 className="w-8 h-8 stroke-1 text-zinc-600" />
                <p className="text-xs">The shared queue is empty.</p>
                <button
                  onClick={() => setIsAddMusicModalOpen(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  Click here to add songs
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-96 overflow-y-auto pr-1">
                {activeRoom.queue.map((track, idx) => {
                  const isCurrent = activeRoom.currentTrack?.id === track.id;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-indigo-950/40 border-indigo-500/30 text-white'
                          : 'bg-white/[0.02] border-white/5 text-zinc-300 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xs font-mono text-zinc-500 w-5 text-right shrink-0">
                          {idx + 1}
                        </span>

                        <div className="w-9 h-9 rounded-lg bg-zinc-800 overflow-hidden shrink-0 border border-white/5 flex items-center justify-center">
                          {track.coverUrl ? (
                            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <Music2 className="w-4 h-4 text-zinc-500" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-medium truncate ${isCurrent ? 'text-indigo-200 font-bold' : 'text-zinc-200'}`}>
                            {track.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {renderSourceBadge(track.source)}
                        <span className="text-[11px] font-mono text-zinc-500">
                          {formatSeconds(track.duration)}
                        </span>

                        <button
                          onClick={() => roomPlayTrack(track)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          title="Play now for the room"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        <button
                          onClick={() => roomRemoveTrack(track.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          title="Remove from room queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: PARTICIPANTS & ACTIVITY (Span 1) */}
        <div className="flex flex-col gap-6">
          
          {/* PARTICIPANTS CARD */}
          <div className="p-6 rounded-3xl bg-[#0b0c12]/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>LISTENING NOW</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {(participants.length > 0 ? participants : [{ id: 'self' }]).length} Active
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {(participants.length > 0
                ? participants
                : [
                    {
                      id: 'self-fallback',
                      name: userDisplayName || 'You',
                      joinedAt: Date.now(),
                      isOwner: isOwner,
                      isSelf: true,
                    },
                  ]
              ).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0b0c12]" />
                    </div>
                    <span className="text-xs font-medium text-zinc-200">
                      {p.name} {p.isSelf && <span className="text-zinc-500 text-[10px]">(You)</span>}
                    </span>
                  </div>

                  {p.isOwner && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ROOM ACTIVITY CARD */}
          <div className="p-6 rounded-3xl bg-[#0b0c12]/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span>ROOM ACTIVITY</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">Live</span>
            </div>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-2">No activity yet</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="text-xs text-zinc-400 flex items-start gap-2 py-1">
                    <span className="text-zinc-600 text-[10px] font-mono mt-0.5">•</span>
                    <p className="leading-tight">
                      <strong className="text-zinc-200 font-semibold">{act.userName}</strong>{' '}
                      {act.actionText}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ROOM DETAILS & CONNECTION INFO */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2 text-xs text-zinc-500 font-mono">
            <div className="flex items-center justify-between">
              <span>Sync Backend:</span>
              <span className="text-zinc-300 capitalize">{backendType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Authority:</span>
              <span className="text-zinc-300">Server Realtime</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Permissions:</span>
              <span className="text-emerald-400">Collaborative (All)</span>
            </div>
          </div>

        </div>

      </div>

      {/* UNIVERSAL SEARCH MODAL FOR ADDING MUSIC */}
      <UniversalSearchModal
        isOpen={isAddMusicModalOpen}
        onClose={() => setIsAddMusicModalOpen(false)}
        title="Add to Shared Room Queue"
        onSelectTrack={(track: Track) => {
          roomAddTrack(track);
          setIsAddMusicModalOpen(false);
        }}
      />

    </div>
  );
};
