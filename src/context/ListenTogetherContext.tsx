import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useMusic } from './MusicContext';
import {
  RoomActionType,
  RoomActivityItem,
  RoomChatMessage,
  RoomConnectionStatus,
  RoomParticipant,
  SharedRoomState,
  SharedRoomTrack,
  sharedTrackToTrack,
  trackToSharedTrack,
} from '../services/realtime/types';
import { roomService } from '../services/realtime/roomService';
import { audioEngine } from '../services/audioEngine';
import { youtubePlayerBridge } from '../services/youtubePlayerBridge';
import { Track } from '../types';

export interface ListenTogetherContextType {
  activeRoom: SharedRoomState | null;
  isInRoom: boolean;
  participants: RoomParticipant[];
  activities: RoomActivityItem[];
  chatMessages: RoomChatMessage[];
  connectionStatus: RoomConnectionStatus;
  backendType: 'supabase' | 'websocket' | 'broadcast';
  userDisplayName: string;
  setUserDisplayName: (name: string) => void;
  isOwner: boolean;
  pendingJoinRoomId: string | null;
  setPendingJoinRoomId: (id: string | null) => void;

  // Personal device playback isolation (take a call / work without disturbing others)
  isLocallySilenced: boolean;
  togglePersonalSilence: () => void;

  // Room lifecycle
  createRoom: (name: string, initialTrack?: Track | null) => Promise<string>;
  joinRoom: (roomId: string, displayName?: string) => Promise<boolean>;
  leaveRoom: () => void;
  copyInviteLink: () => Promise<boolean>;
  shareInviteLink: () => Promise<boolean>;
  sendChatMessage: (text: string) => Promise<boolean>;

  // Room playback actions
  roomPlay: () => Promise<void>;
  roomPause: () => Promise<void>;
  roomTogglePlay: () => Promise<void>;
  roomSeek: (seconds: number) => Promise<void>;
  roomNext: () => Promise<void>;
  roomPrev: () => Promise<void>;
  roomAddTrack: (track: Track) => Promise<boolean>;
  roomRemoveTrack: (trackId: string) => Promise<void>;
  roomReorderQueue: (newQueue: SharedRoomTrack[]) => Promise<void>;
  roomPlayTrack: (track: Track) => Promise<void>;
  roomKickParticipant: (targetUserId: string) => Promise<void>;
}

const ListenTogetherContext = createContext<ListenTogetherContextType | null>(null);

export const ListenTogetherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    playTrack,
    togglePlay,
    seek,
    nextTrack,
    prevTrack,
    registerTrackEndedHandler,
    showToast,
    setCurrentView,
    switchToTrack,
    setQueue,
  } = useMusic();

  const [activeRoom, setActiveRoom] = useState<SharedRoomState | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [activities, setActivities] = useState<RoomActivityItem[]>([]);
  const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<RoomConnectionStatus>('DISCONNECTED');
  const [userDisplayName, setUserDisplayNameState] = useState<string>(() => {
    return roomService.getOrCreateUserIdentity().name;
  });
  const [pendingJoinRoomId, setPendingJoinRoomId] = useState<string | null>(null);
  const [isLocallySilenced, setIsLocallySilenced] = useState(false);
  const isLocallySilencedRef = useRef(false);
  isLocallySilencedRef.current = isLocallySilenced;

  // Guards to prevent feedback loop between local player events and remote room updates
  const isApplyingRemoteRef = useRef(false);
  const activeRoomRef = useRef<SharedRoomState | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const currentTimeRef = useRef(currentTime);
  const currentTrackRef = useRef(currentTrack);

  activeRoomRef.current = activeRoom;
  isPlayingRef.current = isPlaying;
  currentTimeRef.current = currentTime;
  currentTrackRef.current = currentTrack;

  const isInRoom = Boolean(activeRoom && connectionStatus === 'CONNECTED');
  const isOwner = Boolean(
    activeRoom && roomService.getCurrentParticipant()?.id === activeRoom.ownerId
  );

  // Register authoritative live playback position provider with RoomService
  useEffect(() => {
    const provider = () => {
      const track = currentTrackRef.current;
      if (!track) return null;

      const isYT = track.source === 'youtube' && !!track.sourceId;
      let pos = 0;
      let playing = isPlayingRef.current;
      let rate = 1;

      if (isYT) {
        pos = youtubePlayerBridge.getCurrentTime();
        playing = youtubePlayerBridge.getState().isPlaying;
        rate = youtubePlayerBridge.getState().playbackRate || 1;
      } else {
        pos = audioEngine.getCurrentTime();
        playing = audioEngine.isPlaying();
      }

      if (pos <= 0 && currentTimeRef.current > 0) {
        pos = currentTimeRef.current;
      }

      return {
        position: Math.max(0, pos),
        isPlaying: playing,
        playbackRate: rate,
        trackId: track.id,
        source: track.source || 'local',
      };
    };

    roomService.setLivePositionProvider(provider);
    return () => {
      roomService.setLivePositionProvider(null);
    };
  }, []);

  // Parse room ID from URL path, query param, or hash on initial load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let roomIdFromUrl = '';
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    if (path.startsWith('/listen/')) {
      roomIdFromUrl = path.replace('/listen/', '').trim().replace(/\/$/, '');
    } else if (searchParams.get('room')) {
      roomIdFromUrl = searchParams.get('room')!.trim();
    } else if (hash.includes('/listen/')) {
      roomIdFromUrl = hash.split('/listen/')[1]?.trim() || '';
    }

    const cleanId = roomService.cleanRoomCode(roomIdFromUrl);
    if (cleanId) {
      setPendingJoinRoomId(cleanId);
    }
  }, []);

  const setUserDisplayName = useCallback((name: string) => {
    setUserDisplayNameState(name);
    roomService.setDisplayName(name);
  }, []);

  // Synchronize local playback engine with incoming room state
  const handleRemoteStateUpdate = useCallback(
    async (incomingState: SharedRoomState) => {
      setActiveRoom(incomingState);

      const targetTrack = incomingState.currentTrack;
      if (!targetTrack) {
        return;
      }

      // If user locally silenced their audio (phone call / work), don't play locally
      if (isLocallySilencedRef.current) {
        return;
      }

      const expectedPos = roomService.calculateCurrentPosition(incomingState);
      const isDifferentTrack = !currentTrackRef.current || currentTrackRef.current.id !== targetTrack.id;

      isApplyingRemoteRef.current = true;

      try {
        if (isDifferentTrack) {
          const trackToPlay = sharedTrackToTrack(targetTrack);
          const queueTracks = incomingState.queue.map(sharedTrackToTrack);

          // For YouTube playback: store the desired synchronization position
          // so it is applied cleanly the moment the player is ready/playing
          if (targetTrack.source === 'youtube') {
            youtubePlayerBridge.setPendingSyncSeek(expectedPos);
          }

          await switchToTrack(trackToPlay, {
            autoplay: incomingState.isPlaying,
            newQueue: queueTracks,
            index: queueTracks.findIndex((t) => t.id === trackToPlay.id),
            startTime: expectedPos,
          });

          // Late join / mid-track synchronization for local/audius:
          if (targetTrack.source !== 'youtube' && expectedPos > 0.5) {
            setTimeout(() => {
              seek(expectedPos);
            }, 100);
          } else if (targetTrack.source === 'youtube') {
            if (youtubePlayerBridge.isPlayerReady()) {
              youtubePlayerBridge.applyPendingSyncSeekIfNeeded();
            }
          }
        } else {
          // Check if remote update is purely a queue alteration (ADD_TRACK, REMOVE_TRACK, REORDER_QUEUE)
          const isQueueAction =
            incomingState.lastAction?.type === 'ADD_TRACK' ||
            incomingState.lastAction?.type === 'REMOVE_TRACK' ||
            incomingState.lastAction?.type === 'REORDER_QUEUE';

          // Keep local queue in sync with remote room queue
          if (incomingState.queue) {
            const queueTracks = incomingState.queue.map(sharedTrackToTrack);
            setQueue(queueTracks);
          }

          // CRUCIAL BUG FIX: Adding or removing a song in the queue MUST NEVER seek or restart the currently playing track
          if (isQueueAction) {
            return;
          }

          // Track is same; synchronize play/pause state
          if (incomingState.isPlaying !== isPlayingRef.current) {
            togglePlay();
          }

          // Check drift: only seek if it was an explicit host SEEK action or significant genuine drift
          const isSeekAction = incomingState.lastAction?.type === 'SEEK';
          const drift = Math.abs(currentTimeRef.current - expectedPos);
          if (isSeekAction || drift >= roomService.DRIFT_TOLERANCE_HIGH) {
            if (targetTrack.source === 'youtube') {
              if (youtubePlayerBridge.isPlayerReady()) {
                seek(expectedPos);
              } else {
                youtubePlayerBridge.setPendingSyncSeek(expectedPos);
              }
            } else {
              seek(expectedPos);
            }
          }
        }
      } catch (err) {
        console.warn('Error applying remote room state:', err);
      } finally {
        setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 300);
      }
    },
    [switchToTrack, togglePlay, seek, setQueue]
  );

  // Periodic drift check for subtle background sync and tab visibility re-sync
  useEffect(() => {
    if (!isInRoom || !activeRoom || !activeRoom.isPlaying) return;

    const interval = setInterval(() => {
      if (isApplyingRemoteRef.current) return;
      const expected = roomService.calculateCurrentPosition(activeRoom);
      const diff = Math.abs(currentTimeRef.current - expected);

      // Strong drift correction (> 1.2s)
      if (diff > roomService.DRIFT_TOLERANCE_HIGH) {
        seek(expected);
      }
    }, 4000);

    // Tab visibility re-sync: when user returns to backgrounded tab, re-check drift against host position
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'visible') {
        const currentRoom = activeRoomRef.current;
        if (!currentRoom || !currentRoom.isPlaying || isApplyingRemoteRef.current) return;

        // Skip live radio / non-seekable streams
        const track = currentRoom.currentTrack;
        if (track?.source === 'curated_stream' && (!track.duration || track.duration <= 0)) {
          return;
        }

        const expected = roomService.calculateCurrentPosition(currentRoom);

        let actualPos = currentTimeRef.current;
        if (track?.source === 'youtube') {
          actualPos = youtubePlayerBridge.getCurrentTime();
        } else {
          const engPos = audioEngine.getCurrentTime();
          if (engPos > 0) actualPos = engPos;
        }

        const diff = Math.abs(actualPos - expected);
        if (diff >= roomService.DRIFT_TOLERANCE_HIGH) {
          if (track?.source === 'youtube') {
            if (youtubePlayerBridge.isPlayerReady()) {
              seek(expected);
            } else {
              youtubePlayerBridge.setPendingSyncSeek(expected);
            }
          } else {
            seek(expected);
          }
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [isInRoom, activeRoom, seek]);

  // Subscriptions to room service events
  useEffect(() => {
    const unsubState = roomService.onStateUpdate((state) => {
      handleRemoteStateUpdate(state);
    });

    const unsubParticipants = roomService.onParticipantsUpdate((p) => {
      setParticipants(p);
    });

    const unsubActivity = roomService.onActivity((activity) => {
      setActivities((prev) => [activity, ...prev].slice(0, 15));
    });

    const unsubChat = roomService.onChatMessage((msg) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg].slice(-100);
      });
    });

    const unsubStatus = roomService.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsubError = roomService.onError((err) => {
      showToast(err.message, 'error');
      if (err.code === 'KICKED') {
        roomService.leaveRoom();
        setActiveRoom(null);
        setParticipants([]);
        setActivities([]);
        setChatMessages([]);
        setConnectionStatus('ROOM_CLOSED');
        switchToTrack(null);
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', '/');
        }
      }
    });

    return () => {
      unsubState();
      unsubParticipants();
      unsubActivity();
      unsubChat();
      unsubStatus();
      unsubError();
    };
  }, [handleRemoteStateUpdate, showToast, switchToTrack]);

  // Register track completion callback with MusicContext:
  // When a song finishes, loop smoothly to the next song in the room queue
  useEffect(() => {
    if (!isInRoom || !activeRoom) return;

    const unregister = registerTrackEndedHandler(() => {
      const room = activeRoomRef.current;
      if (!room || room.queue.length === 0) return false;

      // The host dispatches NEXT so all clients transition together
      const currentParticipantId = roomService.getCurrentParticipant()?.id;
      const isRoomHost = room.ownerId === currentParticipantId;

      if (isRoomHost) {
        roomService.dispatchAction('NEXT', {}, room);
      }
      return true;
    });

    return () => {
      unregister();
    };
  }, [isInRoom, activeRoom, registerTrackEndedHandler]);

  // Personal device playback isolation (take a call / work without disturbing others)
  const togglePersonalSilence = useCallback(() => {
    setIsLocallySilenced((prev) => {
      const next = !prev;
      if (next) {
        if (isPlayingRef.current) {
          togglePlay();
        }
        showToast('Personal Solo Break / On-Call Mode active. Paused only on your device!', 'info');
      } else {
        if (activeRoomRef.current) {
          const expected = roomService.calculateCurrentPosition(activeRoomRef.current);
          seek(expected);
          if (activeRoomRef.current.isPlaying && !isPlayingRef.current) {
            togglePlay();
          }
        }
        showToast('Resumed sync with shared room!', 'success');
      }
      return next;
    });
  }, [togglePlay, seek, showToast]);

  // Create room
  const createRoom = useCallback(
    async (name: string, initialTrack?: Track | null): Promise<string> => {
      const trackToUse = initialTrack || currentTrack;
      const sharedTrack = trackToUse ? trackToSharedTrack(trackToUse) : null;

      setConnectionStatus('CREATING');
      const { roomId, state } = await roomService.createRoom(
        name,
        sharedTrack,
        userDisplayName
      );

      setActiveRoom(state);
      setConnectionStatus('CONNECTED');
      setPendingJoinRoomId(null);
      setCurrentView('listen-together');

      // Update URL without reloading page
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', `/listen/${roomId}`);
      }

      showToast(`Created room "${state.roomName}"`, 'success');
      return roomId;
    },
    [currentTrack, userDisplayName, showToast, setCurrentView]
  );

  // Join room
  const joinRoom = useCallback(
    async (roomId: string, displayName?: string): Promise<boolean> => {
      const cleanId = roomService.cleanRoomCode(roomId);
      if (!cleanId) {
        showToast('Please enter a valid room code.', 'error');
        return false;
      }

      const name = displayName?.trim() || userDisplayName;
      if (name) setUserDisplayName(name);

      setConnectionStatus('JOINING');
      try {
        const state = await roomService.joinRoom(cleanId, { name });
        if (state) {
          setActiveRoom(state);
          setConnectionStatus('CONNECTED');
          setPendingJoinRoomId(null);
          setCurrentView('listen-together');

          if (typeof window !== 'undefined') {
            window.history.pushState(null, '', `/listen/${cleanId}`);
          }

          showToast(`Joined room "${state.roomName}"`, 'success');

          // Synchronize immediately with room's current playback
          if (state.currentTrack) {
            handleRemoteStateUpdate(state);
          }
          return true;
        } else {
          setConnectionStatus('ROOM_NOT_FOUND');
          showToast('This room is no longer available or the host has left.', 'error');
          return false;
        }
      } catch {
        setConnectionStatus('ROOM_NOT_FOUND');
        showToast('Unable to connect to listening room.', 'error');
        return false;
      }
    },
    [userDisplayName, setUserDisplayName, showToast, handleRemoteStateUpdate, setCurrentView]
  );

  // Leave room
  const leaveRoom = useCallback(() => {
    roomService.leaveRoom();
    setActiveRoom(null);
    setParticipants([]);
    setActivities([]);
    setChatMessages([]);
    setConnectionStatus('DISCONNECTED');
    setPendingJoinRoomId(null);

    // Stop playback completely so room audio doesn't linger in regular AURA player
    switchToTrack(null);

    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
    }

    showToast('Left listening room', 'info');
  }, [showToast, switchToTrack]);

  // Copy share link
  const copyInviteLink = useCallback(async (): Promise<boolean> => {
    if (!activeRoom) return false;
    const url = roomService.getShareableUrl(activeRoom.roomId);

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast('Invite link copied to clipboard', 'success');
        return true;
      }
    } catch {
      // Clipboard blocked in iframe/non-secure context
    }

    showToast(`Room code: #${activeRoom.roomId.toUpperCase()} (${url})`, 'info');
    return false;
  }, [activeRoom, showToast]);

  // Web Share API
  const shareInviteLink = useCallback(async (): Promise<boolean> => {
    if (!activeRoom) return false;
    const url = roomService.getShareableUrl(activeRoom.roomId);

    if (navigator?.share) {
      try {
        await navigator.share({
          title: `Join "${activeRoom.roomName}" on AURA`,
          text: 'Listen to music together in sync on AURA.',
          url,
        });
        return true;
      } catch {
        // User dismissed share dialog
        return false;
      }
    }

    return copyInviteLink();
  }, [activeRoom, copyInviteLink]);

  const sendChatMessage = useCallback(async (text: string): Promise<boolean> => {
    return roomService.sendChatMessage(text);
  }, []);

  // Playback actions
  const roomPlay = useCallback(async () => {
    if (!activeRoom) return;
    await roomService.dispatchAction('PLAY', {}, activeRoom);
  }, [activeRoom]);

  const roomPause = useCallback(async () => {
    if (!activeRoom) return;
    await roomService.dispatchAction('PAUSE', {}, activeRoom);
  }, [activeRoom]);

  const roomTogglePlay = useCallback(async () => {
    if (!activeRoom) return;
    if (activeRoom.isPlaying) {
      await roomPause();
    } else {
      await roomPlay();
    }
  }, [activeRoom, roomPlay, roomPause]);

  const roomSeek = useCallback(
    async (seconds: number) => {
      if (!activeRoom) return;
      if (!isOwner) {
        showToast('Only the host can seek the track.', 'info');
        return;
      }
      seek(seconds);
      await roomService.dispatchAction('SEEK', { position: seconds }, activeRoom);
    },
    [activeRoom, isOwner, seek, showToast]
  );

  const roomNext = useCallback(async () => {
    if (!activeRoom) return;
    await roomService.dispatchAction('NEXT', {}, activeRoom);
  }, [activeRoom]);

  const roomPrev = useCallback(async () => {
    if (!activeRoom) return;
    await roomService.dispatchAction('PREVIOUS', {}, activeRoom);
  }, [activeRoom]);

  const roomAddTrack = useCallback(
    async (track: Track): Promise<boolean> => {
      if (!activeRoom) return false;

      // Section 18: Private local music guard
      if (track.source === 'local' && !track.externalStreamUrl && !track.sourceUrl) {
        showToast(
          'This track is stored only on your device. Shared rooms require streamable tracks (YouTube, Audius, or web streams) so everyone can hear it.',
          'warning'
        );
        return false;
      }

      const sharedTrack = trackToSharedTrack(track);

      // Instant optimistic UI update preserving current playback position
      const currentPos = currentTimeRef.current || (activeRoom ? roomService.calculateCurrentPosition(activeRoom) : 0);
      setActiveRoom((prev) => {
        if (!prev) return prev;
        const exists = prev.queue.some((t) => t.id === sharedTrack.id);
        const newQueue = exists ? prev.queue : [...prev.queue, sharedTrack];
        const newCurrent = prev.currentTrack || sharedTrack;
        return {
          ...prev,
          queue: newQueue,
          currentTrack: newCurrent,
          position: currentPos,
          isPlaying: prev.currentTrack ? prev.isPlaying : true,
          version: (prev.version || 0) + 1,
          updatedAt: Date.now(),
        };
      });

      showToast(`Added "${track.title}" to shared queue`, 'success');
      await roomService.dispatchAction('ADD_TRACK', { track: sharedTrack }, {
        ...activeRoom,
        position: currentPos,
        updatedAt: Date.now(),
      });
      return true;
    },
    [activeRoom, showToast]
  );

  const roomRemoveTrack = useCallback(
    async (trackId: string) => {
      if (!activeRoom) return;
      if (!isOwner) {
        showToast('Only the room host can remove queued tracks.', 'info');
        return;
      }
      setActiveRoom((prev) => {
        if (!prev) return prev;
        const currentPos = roomService.calculateCurrentPosition(prev);
        return {
          ...prev,
          position: currentPos,
          queue: prev.queue.filter((t) => t.id !== trackId),
          version: (prev.version || 0) + 1,
          updatedAt: Date.now(),
        };
      });
      await roomService.dispatchAction('REMOVE_TRACK', { trackId }, activeRoom);
    },
    [activeRoom, isOwner, showToast]
  );

  const roomReorderQueue = useCallback(
    async (newQueue: SharedRoomTrack[]) => {
      if (!activeRoom) return;
      if (!isOwner) {
        showToast('Only the room host can reorder the queue.', 'info');
        return;
      }
      setActiveRoom((prev) => {
        if (!prev) return prev;
        const currentPos = roomService.calculateCurrentPosition(prev);
        return {
          ...prev,
          position: currentPos,
          queue: newQueue,
          version: (prev.version || 0) + 1,
          updatedAt: Date.now(),
        };
      });
      await roomService.dispatchAction('REORDER_QUEUE', { queue: newQueue }, activeRoom);
    },
    [activeRoom, isOwner, showToast]
  );

  const roomKickParticipant = useCallback(
    async (targetUserId: string) => {
      if (!activeRoom || !isOwner) return;
      const ok = await roomService.kickParticipant(targetUserId);
      if (ok) {
        showToast('Participant removed from the room.', 'info');
      } else {
        showToast('Could not remove participant.', 'error');
      }
    },
    [activeRoom, isOwner, showToast]
  );

  const roomPlayTrack = useCallback(
    async (track: Track) => {
      if (!activeRoom) return;

      if (track.source === 'local' && !track.externalStreamUrl && !track.sourceUrl) {
        showToast(
          'This track is stored only on your device. Shared rooms require streamable tracks (YouTube, Audius, or web streams).',
          'warning'
        );
        return;
      }

      const shared = trackToSharedTrack(track);

      // Instant optimistic UI update
      setActiveRoom((prev) => {
        if (!prev) return prev;
        const exists = prev.queue.some((t) => t.id === shared.id);
        const newQueue = exists ? prev.queue : [...prev.queue, shared];
        return {
          ...prev,
          currentTrack: shared,
          queue: newQueue,
          position: 0,
          isPlaying: true,
          version: (prev.version || 0) + 1,
          updatedAt: Date.now(),
        };
      });

      await roomService.dispatchAction('CHANGE_TRACK', { track: shared }, activeRoom);
    },
    [activeRoom, showToast]
  );

  const value: ListenTogetherContextType = {
    activeRoom,
    isInRoom,
    participants,
    activities,
    chatMessages,
    connectionStatus,
    backendType: roomService.getBackendType(),
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

    roomPlay,
    roomPause,
    roomTogglePlay,
    roomSeek,
    roomNext,
    roomPrev,
    roomAddTrack,
    roomRemoveTrack,
    roomReorderQueue,
    roomPlayTrack,
    roomKickParticipant,
  };

  return (
    <ListenTogetherContext.Provider value={value}>
      {children}
    </ListenTogetherContext.Provider>
  );
};

export const useListenTogether = () => {
  const context = useContext(ListenTogetherContext);
  if (!context) {
    throw new Error('useListenTogether must be used within a ListenTogetherProvider');
  }
  return context;
};
