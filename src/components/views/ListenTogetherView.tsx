import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Volume2,
  Lock,
  RefreshCw,
  Clipboard,
  Info,
  CheckCircle2,
  Disc,
  ChevronUp,
  ChevronDown,
  Headphones,
  Sliders,
  Clock,
  VolumeX,
  RadioTower,
  Wifi,
  SlidersHorizontal,
  MessageSquare,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { formatSeconds } from '../../utils/formatTime';
import { Track } from '../../types';
import { UniversalSearchModal } from '../search/UniversalSearchModal';
import { GlassPanel } from '../common/primitives/GlassPanel';
import { SolidCard } from '../common/primitives/SolidCard';
import { TactileButton } from '../common/primitives/TactileButton';
import { TelemetryBadge } from '../common/primitives/TelemetryBadge';
import { roomService } from '../../services/realtime/roomService';

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 15) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function formatChatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ListenTogetherView: React.FC = () => {
  const {
    activeRoom,
    isInRoom,
    participants,
    activities,
    chatMessages,
    connectionStatus,
    backendType,
    userDisplayName,
    setUserDisplayName,
    isOwner,
    pendingJoinRoomId,
    setPendingJoinRoomId,
    isLocallySilenced,
    togglePersonalSilence,
    createRoom,
    joinRoom,
    leaveRoom,
    copyInviteLink,
    shareInviteLink,
    sendChatMessage,
    roomTogglePlay,
    roomSeek,
    roomNext,
    roomPrev,
    roomAddTrack,
    roomRemoveTrack,
    roomReorderQueue,
    roomPlayTrack,
  } = useListenTogether();

  const { currentTime, duration, showToast, setCurrentView } = useMusic();

  // Modal & Form states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(Boolean(pendingJoinRoomId));
  const [isAddMusicModalOpen, setIsAddMusicModalOpen] = useState(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);

  // Social Hub state (Chat, Participants, Activity)
  const [activeSocialTab, setActiveSocialTab] = useState<'chat' | 'participants' | 'activity'>('chat');
  const [chatInputText, setChatInputText] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [roomNameInput, setRoomNameInput] = useState('Late Night Vibes');
  const [joinCodeInput, setJoinCodeInput] = useState(pendingJoinRoomId || '');
  const [displayNameInput, setDisplayNameInput] = useState(userDisplayName);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Scrubber drag state
  const [dragTime, setDragTime] = useState<number | null>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (activeSocialTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeSocialTab]);

  // Sync join code input with pendingJoinRoomId when invite URL is parsed
  useEffect(() => {
    if (pendingJoinRoomId) {
      setJoinCodeInput(pendingJoinRoomId);
      setIsJoinModalOpen(true);
    }
  }, [pendingJoinRoomId]);

  // Handle URL link / code input sanitization
  const handleCodeInputChange = (value: string) => {
    setJoinError(null);
    const cleaned = roomService.cleanRoomCode(value);
    setJoinCodeInput(cleaned.toUpperCase());
  };

  const handlePasteCode = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleCodeInputChange(text);
          showToast('Code pasted from clipboard', 'info');
        }
      }
    } catch {
      showToast('Clipboard permission required to paste', 'warning');
    }
  };

  const handleCopyLink = async () => {
    const success = await copyInviteLink();
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyRoomCode = async () => {
    if (!activeRoom) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(activeRoom.roomId.toUpperCase());
        setCopiedCode(true);
        showToast(`Copied room code #${activeRoom.roomId.toUpperCase()}`, 'success');
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      prompt('Copy room code:', activeRoom.roomId.toUpperCase());
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!roomNameInput.trim()) {
      setCreateError('Please enter a room name');
      return;
    }

    try {
      setIsSubmitting(true);
      await createRoom(roomNameInput.trim());
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setCreateError(err?.message || 'Could not create room. Please check your connection.');
      showToast('Could not create room. Please check connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const code = roomService.cleanRoomCode(joinCodeInput || pendingJoinRoomId || '');
    if (!code) {
      setJoinError('Please enter a valid room code or invite URL');
      return;
    }

    try {
      setIsSubmitting(true);
      const ok = await joinRoom(code, displayNameInput.trim());
      if (ok) {
        setIsJoinModalOpen(false);
        setPendingJoinRoomId(null);
      } else {
        setJoinError('Room not found or no longer active. Check the room code.');
      }
    } catch (err: any) {
      setJoinError('Unable to connect to room. Please try again.');
      showToast('Unable to join room.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = chatInputText.trim();
    if (!trimmed || isSendingChat) return;

    if (trimmed.length > 500) {
      showToast('Message exceeds limit of 500 characters', 'warning');
      return;
    }

    try {
      setIsSendingChat(true);
      const success = await sendChatMessage(trimmed);
      if (success) {
        setChatInputText('');
      } else {
        showToast('Unable to send message. Please check room connection.', 'error');
      }
    } catch {
      showToast('Failed to send message', 'error');
    } finally {
      setIsSendingChat(false);
    }
  };

  // Source badge styling
  const renderSourceBadge = (source?: string) => {
    switch (source) {
      case 'youtube':
        return <TelemetryBadge variant="rose" size="sm">YouTube</TelemetryBadge>;
      case 'audius':
        return <TelemetryBadge variant="amber" size="sm">Audius</TelemetryBadge>;
      case 'jamendo':
        return <TelemetryBadge variant="emerald" size="sm">Jamendo</TelemetryBadge>;
      case 'curated_stream':
        return <TelemetryBadge variant="cyan" size="sm">Curated</TelemetryBadge>;
      default:
        return <TelemetryBadge variant="cyan" size="sm">Stream</TelemetryBadge>;
    }
  };

  const currentTrack = activeRoom?.currentTrack;
  const isPlaying = activeRoom?.isPlaying ?? false;
  const queue = activeRoom?.queue ?? [];

  // Up Next: strictly upcoming tracks excluding the currently playing track (Option A)
  const upcomingTracks = useMemo(() => {
    if (!queue || queue.length === 0) return [];
    if (!currentTrack) return queue;
    const curIdx = queue.findIndex((t) => t.id === currentTrack.id);
    if (curIdx >= 0) {
      return queue.filter((_, idx) => idx !== curIdx);
    }
    return queue;
  }, [queue, currentTrack]);

  // Reorder upcoming tracks safely without affecting current track position
  const handleMoveUpcomingTrack = (upcomingIndex: number, direction: 'up' | 'down') => {
    if (!activeRoom || !upcomingTracks) return;
    const targetIndex = direction === 'up' ? upcomingIndex - 1 : upcomingIndex + 1;
    if (targetIndex < 0 || targetIndex >= upcomingTracks.length) return;

    const newUpcoming = [...upcomingTracks];
    const [moved] = newUpcoming.splice(upcomingIndex, 1);
    newUpcoming.splice(targetIndex, 0, moved);

    const fullQueue = currentTrack ? [currentTrack, ...newUpcoming] : newUpcoming;
    roomReorderQueue(fullQueue);
  };

  // =========================================================================
  // VIEW 1: INVITE LINK PREVIEW / JOIN PROMPT (when opening /listen/:roomId)
  // =========================================================================
  if (pendingJoinRoomId && !isInRoom) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[75vh] select-none">
        <GlassPanel intensity="prominent" elevation="lg" className="w-full p-8 rounded-2xl text-center flex flex-col items-center">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-5">
            <Users className="w-8 h-8" />
          </div>

          <TelemetryBadge variant="cyan" size="sm" dot dotPulse className="mb-3">
            Shared Listening Room Invite
          </TelemetryBadge>

          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight mb-2 font-display">
            Join Room #{pendingJoinRoomId.toUpperCase()}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
            You have been invited to a synchronized audio room. Listen in real time alongside other participants.
          </p>

          <form onSubmit={handleJoinSubmit} className="w-full max-w-sm flex flex-col gap-4 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-zinc-300 uppercase tracking-wider">Your Display Name</label>
              <input
                type="text"
                required
                value={displayNameInput}
                onChange={(e) => {
                  setDisplayNameInput(e.target.value);
                  setUserDisplayName(e.target.value);
                }}
                placeholder="e.g. Priya, Rakesh, Alex"
                className="w-full px-4 py-2.5 rounded-xl bg-[#08090d] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>

            {joinError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <TactileButton
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => {
                  setPendingJoinRoomId(null);
                  setCurrentView('home');
                }}
              >
                Back to Player
              </TactileButton>

              <TactileButton
                variant="primary"
                size="md"
                type="submit"
                disabled={isSubmitting || !displayNameInput.trim()}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5" />
                    <span>Join Room</span>
                  </>
                )}
              </TactileButton>
            </div>
          </form>
        </GlassPanel>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LANDING PAGE (Listen Together - Share a room. Pick a song. Listen in sync.)
  // =========================================================================
  if (!isInRoom || !activeRoom) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 lg:py-16 flex flex-col items-center select-none">
        
        {/* Top Header & Telemetry */}
        <div className="flex items-center gap-3 mb-6">
          <TelemetryBadge variant="emerald" size="md" dot dotPulse>
            {backendType === 'supabase' ? 'Supabase Realtime Engine' : 'AURA Direct WebSocket'}
          </TelemetryBadge>
          <TelemetryBadge variant="glass" size="md">
            Zero-Drift Sync
          </TelemetryBadge>
        </div>

        {/* Title Block */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight text-center mb-3">
          Listen Together
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl text-center mb-10 leading-relaxed">
          Create a room. Invite friends. Listen to synchronized music in real time across any distance.
        </p>

        {/* Primary Balanced 2-Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-12">
          
          {/* Action 1: Create Room */}
          <GlassPanel intensity="prominent" elevation="lg" className="p-6 sm:p-8 rounded-2xl flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                  <Plus className="w-6 h-6" />
                </div>
                <TelemetryBadge variant="cyan" size="sm">Host Session</TelemetryBadge>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Create a Listening Room</h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Host a private shared room. Control queue order, seek tracks, and invite friends with a single shareable link.
              </p>
            </div>

            <TactileButton
              variant="primary"
              size="lg"
              className="w-full justify-center"
              onClick={() => {
                setCreateError(null);
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Room</span>
            </TactileButton>
          </GlassPanel>

          {/* Action 2: Join Room */}
          <GlassPanel intensity="prominent" elevation="lg" className="p-6 sm:p-8 rounded-2xl flex flex-col justify-between group hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
                  <Users className="w-6 h-6" />
                </div>
                <TelemetryBadge variant="glass" size="sm">Participant</TelemetryBadge>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Join Existing Room</h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Enter a room code or paste an invite link to connect directly to an ongoing listening session.
              </p>
            </div>

            <TactileButton
              variant="secondary"
              size="lg"
              className="w-full justify-center"
              onClick={() => {
                setJoinError(null);
                setIsJoinModalOpen(true);
              }}
            >
              <Users className="w-4 h-4 text-zinc-400" />
              <span>Enter Room Code</span>
            </TactileButton>
          </GlassPanel>
        </div>

        {/* Identity & User Configuration Bar */}
        <SolidCard variant="milled" className="w-full max-w-4xl p-4 sm:p-5 rounded-xl mb-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs">
              {(displayNameInput || 'L').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Your Identity</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Listening as:</span>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => {
                    setDisplayNameInput(e.target.value);
                    setUserDisplayName(e.target.value);
                  }}
                  className="bg-[#08090d] border border-white/10 rounded-md text-white text-xs px-2 py-1 font-medium focus:border-indigo-500/60 focus:outline-none"
                  placeholder="Your Name"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Anonymous Session · No Account Required</span>
          </div>
        </SolidCard>

        {/* Feature & Technical Guidelines Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl text-left">
          
          <SolidCard variant="elevated" className="p-5 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
              <Radio className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Universal Streams</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mix official YouTube videos, Audius decentralized tracks, and direct web audio streams into one unified room queue.
            </p>
          </SolidCard>

          <SolidCard variant="elevated" className="p-5 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Drift Correction</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Monotonic playback clock anchoring prevents device time skew and automatically corrects playback position drift.
            </p>
          </SolidCard>

          <SolidCard variant="elevated" className="p-5 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Info className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Private Local Files</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Local music files remain private on your device. Shared rooms require streamable audio sources so all members hear the track.
            </p>
          </SolidCard>

        </div>

        {/* CREATE ROOM MODAL */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <GlassPanel intensity="prominent" elevation="lg" className="w-full max-w-md p-6 sm:p-8 rounded-2xl text-left">
              <h2 className="text-lg font-bold text-white mb-1">Create Listening Room</h2>
              <p className="text-xs text-zinc-400 mb-6">
                Establish a new synchronized listening room as the session host.
              </p>

              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-zinc-300 uppercase tracking-wider">Room Name</label>
                  <input
                    type="text"
                    required
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                    placeholder="e.g. Late Night Vibes, Lo-Fi Study"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08090d] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/60"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-zinc-300 uppercase tracking-wider">Your Host Name</label>
                  <input
                    type="text"
                    required
                    value={displayNameInput}
                    onChange={(e) => {
                      setDisplayNameInput(e.target.value);
                      setUserDisplayName(e.target.value);
                    }}
                    placeholder="e.g. Host Name"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08090d] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/60"
                  />
                </div>

                {createError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Playback Control Mode:</span>
                  <TelemetryBadge variant="emerald" size="sm">Host Seek + Shared Play</TelemetryBadge>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <TactileButton
                    variant="ghost"
                    size="md"
                    className="flex-1"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </TactileButton>

                  <TactileButton
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={isSubmitting || !roomNameInput.trim()}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Room</span>
                      </>
                    )}
                  </TactileButton>
                </div>
              </form>
            </GlassPanel>
          </div>
        )}

        {/* JOIN ROOM MODAL */}
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <GlassPanel intensity="prominent" elevation="lg" className="w-full max-w-md p-6 sm:p-8 rounded-2xl text-left">
              <h2 className="text-lg font-bold text-white mb-1">Join Listening Room</h2>
              <p className="text-xs text-zinc-400 mb-6">
                Enter the 6-character room code or full invite URL.
              </p>

              <form onSubmit={handleJoinSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-zinc-300 uppercase tracking-wider">Room Code / URL</label>
                    <button
                      type="button"
                      onClick={handlePasteCode}
                      className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Clipboard className="w-3 h-3" />
                      <span>Paste</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={joinCodeInput}
                    onChange={(e) => handleCodeInputChange(e.target.value)}
                    placeholder="e.g. ABC123 or https://app/listen/abc123"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08090d] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/60 uppercase font-mono tracking-wider"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-zinc-300 uppercase tracking-wider">Your Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayNameInput}
                    onChange={(e) => {
                      setDisplayNameInput(e.target.value);
                      setUserDisplayName(e.target.value);
                    }}
                    placeholder="e.g. Listener Name"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#08090d] border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/60"
                  />
                </div>

                {joinError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{joinError}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <TactileButton
                    variant="ghost"
                    size="md"
                    className="flex-1"
                    onClick={() => {
                      setIsJoinModalOpen(false);
                      setJoinError(null);
                    }}
                  >
                    Cancel
                  </TactileButton>

                  <TactileButton
                    variant="primary"
                    size="md"
                    type="submit"
                    disabled={isSubmitting || !joinCodeInput.trim()}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-3.5 h-3.5" />
                        <span>Join Session</span>
                      </>
                    )}
                  </TactileButton>
                </div>
              </form>
            </GlassPanel>
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // VIEW 3: ACTIVE LISTENING LOUNGE (Synchronized Music Session)
  // =========================================================================
  const displayCurrentTime = dragTime !== null ? dragTime : currentTime;
  const currentDuration = currentTrack?.duration || duration || 0;
  const progressPercent = currentDuration > 0 ? (displayCurrentTime / currentDuration) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 flex flex-col gap-5 sm:gap-6 select-none overflow-x-hidden">
      
      {/* 1. ROOM HEADER (Identity, Status, Sharing & Exit) */}
      <GlassPanel intensity="prominent" elevation="lg" className="p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Room Identity Block */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <TactileButton
            variant="ghost"
            size="icon"
            onClick={leaveRoom}
            title="Leave room and return to player"
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </TactileButton>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold text-white tracking-tight truncate max-w-sm sm:max-w-md">
                {activeRoom.roomName}
              </h1>

              {/* Click-to-copy Room Code Pill */}
              <button
                type="button"
                onClick={handleCopyRoomCode}
                title="Click to copy 6-character room code"
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 font-mono text-[11px] font-semibold transition-colors cursor-pointer group active:scale-95"
              >
                <span>#{activeRoom.roomId.toUpperCase()}</span>
                {copiedCode ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-zinc-400 group-hover:text-white" />
                )}
              </button>

              <TelemetryBadge variant={connectionStatus === 'CONNECTED' ? 'emerald' : 'amber'} size="sm" dot dotPulse>
                {connectionStatus === 'CONNECTED' ? 'Synchronized' : 'Reconnecting'}
              </TelemetryBadge>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-zinc-400 flex-wrap">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{participants.length || 1} Listening Now</span>
              </div>
              <span className="text-zinc-600">·</span>
              <span className="truncate">Host: <strong className="text-zinc-200 font-semibold">{activeRoom.ownerName}</strong></span>
              {isOwner && (
                <>
                  <span className="text-zinc-600">·</span>
                  <span className="text-indigo-400 font-mono text-[11px]">(You are Host)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions Block (Copy, Share, Diagnostics, Leave) */}
        <div className="flex items-center gap-2 shrink-0 justify-end flex-wrap">
          <TactileButton
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
            title="Copy full invite link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copiedLink ? 'Link Copied' : 'Invite Link'}</span>
          </TactileButton>

          <TactileButton
            variant="secondary"
            size="icon"
            onClick={shareInviteLink}
            title="Share room invitation"
          >
            <Share2 className="w-4 h-4" />
          </TactileButton>

          <TactileButton
            variant="ghost"
            size="icon"
            onClick={() => setIsDiagnosticsModalOpen(true)}
            title="Room connection diagnostics"
          >
            <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
          </TactileButton>

          <TactileButton
            variant="danger"
            size="sm"
            onClick={leaveRoom}
            title="Disconnect from shared room"
          >
            Leave Room
          </TactileButton>
        </div>
      </GlassPanel>

      {/* 2. MAIN ACTIVE LOUNGE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* LEFT COLUMN: NOW PLAYING & SHARED QUEUE (Span 2) */}
        <div className="lg:col-span-2 flex flex-col gap-5 sm:gap-6">
          
          {/* NOW PLAYING CENTREPIECE */}
          <GlassPanel intensity="prominent" elevation="lg" className="p-5 sm:p-7 rounded-2xl flex flex-col gap-6 relative overflow-hidden">
            
            {/* Top Bar inside Now Playing */}
            <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Disc className={`w-3.5 h-3.5 text-indigo-400 ${isPlaying ? 'animate-spin [animation-duration:4s]' : ''}`} />
                <span className="font-mono uppercase tracking-widest text-[10px] text-zinc-400 font-semibold">
                  ROOM AUDIO CENTREPIECE
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentTrack?.source && renderSourceBadge(currentTrack.source)}
                {isOwner ? (
                  <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Host Seeking Enabled
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-500">
                    Host Controls Seek
                  </span>
                )}
              </div>
            </div>

            {/* Now Playing State or Empty State */}
            {currentTrack ? (
              <>
                {/* Artwork & Metadata Showcase */}
                <div className="w-full min-w-0 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
                  
                  {/* Artwork Container */}
                  <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 shadow-2xl group">
                    {currentTrack.coverUrl ? (
                      <img
                        src={currentTrack.coverUrl}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-950/70 via-purple-950/50 to-zinc-950 text-indigo-300">
                        <Music2 className="w-14 h-14 stroke-1" />
                      </div>
                    )}

                    {/* Equalizer Pulsing Overlay when Playing */}
                    {isPlaying && !isLocallySilenced && (
                      <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-end justify-center pb-3 pointer-events-none">
                        <span className="flex items-end gap-1.5 h-6">
                          <span className="w-1.5 bg-indigo-400 animate-[bounce_0.8s_infinite_100ms] rounded-full h-4" />
                          <span className="w-1.5 bg-indigo-400 animate-[bounce_0.8s_infinite_300ms] rounded-full h-6" />
                          <span className="w-1.5 bg-indigo-400 animate-[bounce_0.8s_infinite_200ms] rounded-full h-3" />
                          <span className="w-1.5 bg-indigo-400 animate-[bounce_0.8s_infinite_400ms] rounded-full h-5" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metadata Hierarchy */}
                  <div className="w-full min-w-0 flex flex-col justify-center pt-1 overflow-hidden">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold mb-1">
                      CURRENTLY PLAYING FOR ALL LISTENERS
                    </span>
                    <h2 
                      className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight break-words line-clamp-2 mb-1.5 font-display"
                      title={currentTrack.title}
                    >
                      {currentTrack.title}
                    </h2>
                    <p 
                      className="text-sm sm:text-base text-zinc-300 truncate mb-3 font-medium"
                      title={currentTrack.artist}
                    >
                      {currentTrack.artist}
                    </p>

                    <div className="flex items-center gap-2 justify-center sm:justify-start text-xs font-mono text-zinc-400 flex-wrap">
                      <span className="truncate max-w-[180px] sm:max-w-xs">{currentTrack.album || 'Single Release'}</span>
                      <span>·</span>
                      <span>{formatSeconds(currentTrack.duration)}</span>
                      <span>·</span>
                      <span className="capitalize">{currentTrack.source || 'Stream'}</span>
                    </div>
                  </div>
                </div>

                {/* Scrubber Progress Bar */}
                <div className="flex flex-col gap-2 pt-2 w-full">
                  <div
                    className={`relative h-2.5 rounded-full bg-white/10 overflow-hidden ${
                      isOwner ? 'cursor-pointer group' : 'cursor-not-allowed opacity-90'
                    }`}
                    title={isOwner ? 'Click to seek playback position (Host)' : 'Seeking is reserved for the room host'}
                    onClick={(e) => {
                      if (!isOwner) {
                        showToast('Only the room host can seek track position.', 'info');
                        return;
                      }
                      if (!currentDuration) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const percent = Math.max(0, Math.min(1, clickX / rect.width));
                      roomSeek(percent * currentDuration);
                    }}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full transition-all duration-100"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-0.5">
                    <span>{formatSeconds(displayCurrentTime)}</span>
                    <span className="text-[11px] text-zinc-500 font-sans">
                      {isOwner ? '★ Host Seeking Enabled' : 'Host Controls Seek Position'}
                    </span>
                    <span>{formatSeconds(currentDuration)}</span>
                  </div>
                </div>

                {/* Transport Controls */}
                <div className="flex items-center justify-center gap-6 pt-1">
                  <TactileButton
                    variant="ghost"
                    size="icon"
                    onClick={() => roomPrev()}
                    title="Previous track"
                    className="p-3"
                  >
                    <SkipBack className="w-5 h-5 fill-current" />
                  </TactileButton>

                  <TactileButton
                    variant="primary"
                    size="lg"
                    onClick={() => roomTogglePlay()}
                    title={isPlaying && !isLocallySilenced ? 'Pause for room' : 'Play for room'}
                    className="rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-xl shadow-indigo-600/30"
                  >
                    {isPlaying && !isLocallySilenced ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    )}
                  </TactileButton>

                  <TactileButton
                    variant="ghost"
                    size="icon"
                    onClick={() => roomNext()}
                    title="Next track"
                    className="p-3"
                  >
                    <SkipForward className="w-5 h-5 fill-current" />
                  </TactileButton>
                </div>

                {/* Personal Solo Break / Device Mute */}
                <div className="pt-1 flex justify-center w-full">
                  <button
                    type="button"
                    onClick={togglePersonalSilence}
                    className={`max-w-full px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 border transition-all cursor-pointer ${
                      isLocallySilenced
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                        : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                    title="Pause playback on your device only without interrupting others"
                  >
                    {isLocallySilenced ? (
                      <>
                        <VolumeX className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="truncate">Solo Break Active (Muted for You) · Click to Resume</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="truncate">Take Solo Break (Mute for You Only)</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* ELEGANT EMPTY NOW PLAYING STATE */
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 shadow-inner">
                  <Music2 className="w-10 h-10 stroke-1" />
                </div>

                <TelemetryBadge variant="glass" size="sm" className="mb-2">
                  Waiting for Tracks
                </TelemetryBadge>

                <h3 className="text-xl font-bold text-white mb-2 font-display">
                  No Track Currently Playing
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
                  The room is quiet. Add a song from YouTube, Audius, or web streams to start synchronized listening with everyone.
                </p>

                <TactileButton
                  variant="primary"
                  size="md"
                  onClick={() => setIsAddMusicModalOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Song to Room</span>
                </TactileButton>
              </div>
            )}
          </GlassPanel>

          {/* SHARED QUEUE (UP NEXT — OPTION A: STRICTLY UPCOMING TRACKS) */}
          <GlassPanel intensity="prominent" elevation="lg" className="p-5 sm:p-6 rounded-2xl flex flex-col gap-4">
            
            {/* Queue Section Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Up Next</h3>
                  <TelemetryBadge variant="glass" size="sm">
                    {upcomingTracks.length} upcoming
                  </TelemetryBadge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Shared room playlist · Total {queue.length} track{queue.length === 1 ? '' : 's'}
                </p>
              </div>

              <TactileButton
                variant="secondary"
                size="sm"
                onClick={() => setIsAddMusicModalOpen(true)}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Music</span>
              </TactileButton>
            </div>

            {/* Upcoming Track List (Option A: Current track is shown in Now Playing, Up Next shows strictly upcoming tracks) */}
            {upcomingTracks.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center gap-3 text-zinc-500 border border-dashed border-white/10 rounded-2xl">
                <Music2 className="w-7 h-7 stroke-1 text-zinc-600" />
                <p className="text-xs">No upcoming tracks in the queue.</p>
                <button
                  type="button"
                  onClick={() => setIsAddMusicModalOpen(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline underline-offset-4"
                >
                  Click here to queue more songs
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
                {upcomingTracks.map((track, idx) => {
                  return (
                    <SolidCard
                      key={`${track.id}-${idx}`}
                      variant="elevated"
                      className="p-3 rounded-xl flex items-center justify-between gap-3 transition-all"
                    >
                      {/* Left: Index / Cover / Title / Artist */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-5 text-right shrink-0">
                          <span className="text-xs font-mono text-zinc-500">
                            {idx + 1}
                          </span>
                        </div>

                        {/* Thumbnail Artwork */}
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden shrink-0 border border-white/10 flex items-center justify-center shadow-sm">
                          {track.coverUrl ? (
                            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                          ) : (
                            <Music2 className="w-4 h-4 text-zinc-500" />
                          )}
                        </div>

                        {/* Titles */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-200 truncate" title={track.title}>
                            {track.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5" title={track.artist}>
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      {/* Right: Source, Duration & Control Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-flex">
                          {renderSourceBadge(track.source)}
                        </span>
                        
                        <span className="text-[11px] font-mono text-zinc-400 hidden xs:inline-block">
                          {formatSeconds(track.duration)}
                        </span>

                        {/* Move Up / Move Down Reordering Buttons (Operating on upcomingTracks) */}
                        <div className="flex items-center border border-white/10 rounded-lg bg-white/[0.03] overflow-hidden">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveUpcomingTrack(idx, 'up')}
                            className="p-1 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                            title="Move track up in Up Next"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === upcomingTracks.length - 1}
                            onClick={() => handleMoveUpcomingTrack(idx, 'down')}
                            className="p-1 hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer border-l border-white/10"
                            title="Move track down in Up Next"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Play Now for Room */}
                        <TactileButton
                          variant="ghost"
                          size="icon"
                          onClick={() => roomPlayTrack(track)}
                          title="Play this track now for all listeners"
                          className="p-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current text-indigo-400" />
                        </TactileButton>

                        {/* Remove Track */}
                        <TactileButton
                          variant="ghost"
                          size="icon"
                          onClick={() => roomRemoveTrack(track.id)}
                          title="Remove from room queue"
                          className="p-1.5 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </TactileButton>
                      </div>
                    </SolidCard>
                  );
                })}
              </div>
            )}
          </GlassPanel>

        </div>

        {/* RIGHT COLUMN: SOCIAL HUB (Live Chat, Participants, Activity) */}
        <div className="flex flex-col gap-5 sm:gap-6">
          <GlassPanel intensity="prominent" elevation="lg" className="rounded-2xl flex flex-col overflow-hidden border border-white/10 shadow-2xl">
            {/* Social Header & Segmented Tabs */}
            <div className="p-3.5 sm:p-4 border-b border-white/5 bg-white/[0.02] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-300 font-bold">
                    ROOM SOCIAL HUB
                  </span>
                </div>
                <TelemetryBadge variant="emerald" size="sm">
                  {participants.length || 1} Online
                </TelemetryBadge>
              </div>

              {/* Segmented Control */}
              <div className="grid grid-cols-3 gap-1 bg-[#0b0d14] p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveSocialTab('chat')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeSocialTab === 'chat'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                  {chatMessages.length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeSocialTab === 'chat' ? 'bg-white/20 text-white' : 'bg-white/10 text-zinc-300'
                    }`}>
                      {chatMessages.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSocialTab('participants')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeSocialTab === 'participants'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>People</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeSocialTab === 'participants' ? 'bg-white/20 text-white' : 'bg-white/10 text-zinc-300'
                  }`}>
                    {participants.length || 1}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSocialTab('activity')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeSocialTab === 'activity'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Activity</span>
                </button>
              </div>
            </div>

            {/* TAB 1: LIVE CHAT */}
            {activeSocialTab === 'chat' && (
              <div className="flex flex-col h-[440px] sm:h-[480px]">
                {/* Notice header */}
                <div className="px-4 py-1.5 bg-indigo-500/5 border-b border-indigo-500/10 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Real-time room conversation</span>
                  </span>
                  <span className="text-zinc-500">Live · Session only</span>
                </div>

                {/* Messages scroll area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0">
                  {chatMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-500 my-auto">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-center text-zinc-400 mb-3">
                        <MessageSquare className="w-6 h-6 stroke-1" />
                      </div>
                      <p className="text-sm font-medium text-zinc-300 mb-1">No messages yet</p>
                      <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed">
                        Say hello to everyone listening with you right now.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const currentParticipantId = roomService.getCurrentParticipant()?.id;
                      const isSelf = msg.senderId === currentParticipantId || msg.senderName === userDisplayName;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2.5 ${isSelf ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}
                        >
                          {/* Avatar */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 shadow-sm ${
                            isSelf
                              ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white'
                              : msg.isHost
                              ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white'
                              : 'bg-gradient-to-br from-zinc-700 to-zinc-800 text-zinc-200'
                          }`}>
                            {msg.senderName.charAt(0).toUpperCase()}
                          </div>

                          {/* Bubble and info */}
                          <div className={`flex flex-col gap-1 max-w-[82%] ${isSelf ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                              <span className="font-semibold text-zinc-300 truncate max-w-[120px]">
                                {msg.senderName}
                              </span>
                              {isSelf && <span className="text-zinc-500 font-mono">(You)</span>}
                              {msg.isHost && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] border border-amber-500/30">
                                  Host
                                </span>
                              )}
                              <span className="text-zinc-600 font-mono">·</span>
                              <span className="text-zinc-500 font-mono">
                                {formatChatTime(msg.timestamp)}
                              </span>
                            </div>

                            <div className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words whitespace-pre-wrap ${
                              isSelf
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white/[0.07] border border-white/10 text-zinc-200 rounded-tl-none'
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Composer */}
                <form
                  onSubmit={handleSendChat}
                  className="p-3 border-t border-white/5 bg-[#090b10] flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder="Say something to the room..."
                      maxLength={500}
                      className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500/60 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!chatInputText.trim() || isSendingChat}
                      className="shrink-0 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5 font-medium text-xs shadow-sm"
                      title="Send message (Enter)"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1 font-mono">
                    <span>Press Enter to send</span>
                    <span className={chatInputText.length > 450 ? 'text-amber-400 font-semibold' : ''}>
                      {chatInputText.length}/500
                    </span>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: PARTICIPANTS */}
            {activeSocialTab === 'participants' && (
              <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/5 pb-2.5">
                  <span className="font-mono uppercase tracking-wider text-[11px] text-zinc-300 font-bold">
                    Connected Listeners ({participants.length || 1})
                  </span>
                  <TelemetryBadge variant="emerald" size="sm" dot>
                    Active Roster
                  </TelemetryBadge>
                </div>

                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
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
                  ).map((p) => {
                    const currentParticipantId = roomService.getCurrentParticipant()?.id;
                    const isSelf = p.isSelf || p.id === currentParticipantId;
                    return (
                      <SolidCard key={p.id} variant="flat" className="p-3 rounded-xl flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm ${
                              p.isOwner
                                ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                                : 'bg-gradient-to-br from-indigo-600 to-purple-600'
                            }`}>
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0e1017]" />
                          </div>

                          <div className="min-w-0 flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-zinc-200 truncate">
                                {p.name}
                              </span>
                              {isSelf && (
                                <span className="text-zinc-500 text-[10px] font-mono">(You)</span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Joined {formatRelativeTime(p.joinedAt || Date.now())}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {p.isOwner && (
                            <TelemetryBadge variant="cyan" size="sm">Host</TelemetryBadge>
                          )}
                        </div>
                      </SolidCard>
                    );
                  })}
                </div>

                {/* Host Moderation Notice */}
                <SolidCard variant="flat" className="p-3 rounded-xl flex flex-col gap-1.5 text-xs text-zinc-400 bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Host Moderation & Roles</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-zinc-500">
                    Host <strong className="text-zinc-300 font-medium">{activeRoom.ownerName}</strong> holds authoritative track-seek control. Server-authoritative participant removal is planned for Phase 3.5B.3 authorization execution.
                  </p>
                </SolidCard>
              </div>
            )}

            {/* TAB 3: ACTIVITY */}
            {activeSocialTab === 'activity' && (
              <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/5 pb-2.5">
                  <span className="font-mono uppercase tracking-wider text-[11px] text-zinc-300 font-bold">
                    Room Event Stream
                  </span>
                  <TelemetryBadge variant="glass" size="sm">Live</TelemetryBadge>
                </div>

                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                  {activities.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-6 text-center">No room events recorded yet</p>
                  ) : (
                    activities.map((act) => (
                      <div key={act.id} className="text-xs text-zinc-400 flex items-start gap-2.5 py-1.5 border-b border-white/[0.03] last:border-none">
                        <span className="text-indigo-400 text-xs font-mono mt-0.5">•</span>
                        <div className="flex-1 min-w-0">
                          <p className="leading-snug break-words">
                            <strong className="text-zinc-200 font-semibold">{act.userName}</strong>{' '}
                            {act.actionText}
                          </p>
                          <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                            {formatRelativeTime(act.timestamp || Date.now())}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </GlassPanel>

          {/* QUICK SESSION GUIDELINES */}
          <SolidCard variant="flat" className="p-4 rounded-xl flex flex-col gap-2.5 text-xs text-zinc-400">
            <div className="flex items-center gap-2 text-indigo-300 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Room Playback Rules</span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Anyone can play, pause, or queue tracks. Scrubbing and position seeking are synchronized exclusively by the room host.
            </p>
          </SolidCard>

        </div>

      </div>

      {/* DIAGNOSTICS & SYNC MODAL */}
      {isDiagnosticsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <GlassPanel intensity="prominent" elevation="lg" className="w-full max-w-md p-6 rounded-2xl text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Room Connection Diagnostics</h2>
              </div>
              <TactileButton
                variant="ghost"
                size="sm"
                onClick={() => setIsDiagnosticsModalOpen(false)}
              >
                Close
              </TactileButton>
            </div>

            <div className="flex flex-col gap-3 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                <span className="text-zinc-400">Room Code:</span>
                <span className="text-white font-bold">#{activeRoom.roomId.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                <span className="text-zinc-400">Sync Engine:</span>
                <span className="text-emerald-400 capitalize">{backendType} Realtime</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                <span className="text-zinc-400">State Sequence:</span>
                <span className="text-zinc-300">v{activeRoom.version || 1}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                <span className="text-zinc-400">Drift Correction:</span>
                <span className="text-indigo-300">Monotonic Arrival Anchor</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03]">
                <span className="text-zinc-400">Seek Permission:</span>
                <span className="text-amber-400">{isOwner ? 'You (Host)' : 'Host Only'}</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 mt-4 leading-relaxed font-sans">
              All room state updates are timestamped and monotonically sequenced to prevent multi-device clock skew.
            </p>
          </GlassPanel>
        </div>
      )}

      {/* UNIVERSAL SEARCH MODAL FOR ADDING MUSIC */}
      <UniversalSearchModal
        isOpen={isAddMusicModalOpen}
        onClose={() => setIsAddMusicModalOpen(false)}
        title="Add Track to Shared Room Queue"
        onSelectTrack={(track: Track) => {
          roomAddTrack(track);
          setIsAddMusicModalOpen(false);
        }}
      />

    </div>
  );
};
