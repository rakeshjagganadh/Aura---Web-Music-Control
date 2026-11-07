import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';
import {
  IRoomRealtimeAdapter,
  LivePlaybackPositionProvider,
  RealtimeBackendType,
  RoomActionPayload,
  RoomActivityItem,
  RoomChatMessage,
  RoomConnectionStatus,
  RoomParticipant,
  SharedRoomState,
} from './types';

export class SupabaseRealtimeAdapter implements IRoomRealtimeAdapter {
  public backendType: RealtimeBackendType = 'supabase';

  private client: SupabaseClient | null = null;
  private channel: RealtimeChannel | null = null;
  private roomId: string | null = null;
  private currentParticipant: RoomParticipant | null = null;
  private currentState: SharedRoomState | null = null;
  private livePositionProvider: LivePlaybackPositionProvider | null = null;

  private stateListeners = new Set<(state: SharedRoomState) => void>();
  private participantsListeners = new Set<(participants: RoomParticipant[]) => void>();
  private activityListeners = new Set<(activity: RoomActivityItem) => void>();
  private statusListeners = new Set<(status: RoomConnectionStatus) => void>();
  private chatListeners = new Set<(message: RoomChatMessage) => void>();

  constructor() {
    this.client = getSupabaseClient();
  }

  public setLivePositionProvider(provider: LivePlaybackPositionProvider | null): void {
    this.livePositionProvider = provider;
  }

  /**
   * Captures the host's actual live playback position directly from the player engine.
   * Updates position and sets updatedAt = Date.now() so joining participants never extrapolate stale time.
   */
  private getAuthoritativeHostState(): SharedRoomState {
    if (!this.currentState) return this.currentState as any;
    let liveState = { ...this.currentState };

    if (this.livePositionProvider) {
      try {
        const live = this.livePositionProvider();
        if (live && typeof live.position === 'number' && !isNaN(live.position)) {
          liveState.position = Math.max(0, live.position);
          if (typeof live.isPlaying === 'boolean') {
            liveState.isPlaying = live.isPlaying;
          }
          if (typeof live.playbackRate === 'number' && live.playbackRate > 0) {
            liveState.playbackRate = live.playbackRate;
          }
          liveState.updatedAt = Date.now();
          this.currentState = liveState;
          return liveState;
        }
      } catch (err) {
        console.warn('Error querying live playback position provider on host:', err);
      }
    }

    // Fallback if no live provider registered: calculate elapsed since last update
    if (liveState.isPlaying && liveState.updatedAt) {
      const rawElapsed = (Date.now() - liveState.updatedAt) / 1000;
      // Cap at 3s if unanchored to avoid large jumps
      const elapsed = Math.max(0, Math.min(3, rawElapsed)) * (liveState.playbackRate || 1);
      const maxDur = liveState.currentTrack?.duration || 999999;
      liveState.position = Math.min(maxDur, (liveState.position || 0) + elapsed);
      liveState.updatedAt = Date.now();
      this.currentState = liveState;
    }

    return liveState;
  }

  public async connect(
    roomId: string,
    participant: RoomParticipant,
    initialState?: SharedRoomState
  ): Promise<SharedRoomState | null> {
    if (!this.client) {
      this.notifyStatus('DISCONNECTED');
      throw new Error('Supabase client is not configured');
    }

    // Clean and normalize roomId
    const cleanRoom = roomId.trim().toLowerCase();
    this.roomId = cleanRoom;
    this.currentParticipant = participant;
    this.notifyStatus('CONNECTING');

    // 1. Fetch existing room state from database if available
    let loadedState: SharedRoomState | null = null;
    try {
      const { data, error } = await this.client
        .from('aura_room_state')
        .select('*')
        .eq('room_id', cleanRoom)
        .maybeSingle();

      if (!error && data) {
        loadedState = {
          roomId: data.room_id,
          roomName: data.room_name || 'AURA Listening Room',
          ownerId: data.owner_id || participant.id,
          ownerName: data.owner_name || participant.name,
          currentTrack: data.current_track,
          queue: Array.isArray(data.queue) ? data.queue : [],
          isPlaying: Boolean(data.is_playing),
          position: Number(data.position) || 0,
          playbackRate: Number(data.playback_rate) || 1,
          updatedAt: Number(data.updated_at) || Date.now(),
          version: Number(data.version) || 1,
          lastAction: data.last_action,
        };
      }
    } catch {
      // Table may not exist yet or offline
    }

    // If no state exists in database and initial state is provided (e.g. Creator)
    if (!loadedState && initialState) {
      loadedState = initialState;
      try {
        await this.client.from('aura_room_state').upsert({
          room_id: initialState.roomId,
          room_name: initialState.roomName,
          owner_id: initialState.ownerId,
          owner_name: initialState.ownerName,
          current_track: initialState.currentTrack,
          queue: initialState.queue,
          is_playing: initialState.isPlaying,
          position: initialState.position,
          playback_rate: initialState.playbackRate,
          updated_at: initialState.updatedAt,
          version: initialState.version,
          last_action: initialState.lastAction,
        });
      } catch {
        // Continue with memory state
      }
    }

    if (loadedState) {
      this.currentState = loadedState;
    }

    // 2. Setup Supabase Realtime Channel
    const channelName = `aura-room:${cleanRoom}`;
    this.channel = this.client.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: participant.id },
      },
    });

    // Connection resolver to support peer state sync
    let isConnectResolved = false;
    let connectResolver: ((state: SharedRoomState | null) => void) | null = null;

    const resolveConnection = (state: SharedRoomState | null) => {
      if (!isConnectResolved && connectResolver) {
        isConnectResolved = true;
        if (state) {
          this.currentState = state;
        }
        connectResolver(state);
      }
    };

    // Listen for broadcasted state updates
    this.channel.on('broadcast', { event: 'ROOM_STATE_UPDATED' }, ({ payload }) => {
      const incomingState = payload as SharedRoomState;
      if (!incomingState || (incomingState.roomId && incomingState.roomId.toLowerCase() !== this.roomId)) return;

      // Version monotonic guard: do not accept stale updates unless it is a fresh live sync response from the host
      const isFreshHostSync = Math.abs(Date.now() - (incomingState.updatedAt || 0)) < 4000;
      if (this.currentState && incomingState.version < this.currentState.version && !isFreshHostSync) {
        return;
      }

      this.currentState = incomingState;
      this.notifyState(incomingState);

      // Successfully received authoritative state from host
      resolveConnection(incomingState);

      if (incomingState.lastAction) {
        this.notifyActivity({
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userName: incomingState.lastAction.userName,
          actionText: incomingState.lastAction.description,
          timestamp: incomingState.lastAction.timestamp,
        });
      }
    });

    // Listen for state requests from joining peers (Host answers with fresh live state)
    this.channel.on('broadcast', { event: 'REQUEST_ROOM_STATE' }, () => {
      const isOwner =
        this.currentParticipant &&
        this.currentState &&
        this.currentState.ownerId === this.currentParticipant.id;

      // ONLY the room host/owner answers to avoid multi-peer state collision
      if (isOwner && this.channel && this.currentState) {
        const liveState = this.getAuthoritativeHostState();
        this.channel.send({
          type: 'broadcast',
          event: 'ROOM_STATE_UPDATED',
          payload: liveState,
        });
      }
    });

    // Listen for broadcasted playback actions
    this.channel.on('broadcast', { event: 'PLAYBACK_ACTION' }, ({ payload }) => {
      const action = payload as RoomActionPayload;
      if (!action) return;

      this.notifyActivity({
        id: action.actionId,
        userName: action.userName,
        actionText: this.formatActionDescription(action),
        timestamp: action.timestamp,
      });
    });

    // Listen for broadcasted room chat messages
    this.channel.on('broadcast', { event: 'CHAT_MESSAGE' }, ({ payload }) => {
      const msg = payload as RoomChatMessage;
      if (!msg || (msg.roomId && msg.roomId.toLowerCase() !== this.roomId)) return;
      this.notifyChatMessage(msg);
    });

    // Listen for Presence sync
    this.channel.on('presence', { event: 'sync' }, () => {
      if (!this.channel) return;
      const presenceState = this.channel.presenceState();
      const participants: RoomParticipant[] = [];

      Object.keys(presenceState).forEach((key) => {
        const presences = presenceState[key] as any[];
        if (presences && presences.length > 0) {
          const p = presences[0];
          participants.push({
            id: key,
            name: p.name || 'Listener',
            joinedAt: p.joinedAt || Date.now(),
            isOwner: Boolean(p.isOwner),
            isSelf: key === participant.id,
          });
        }
      });

      this.notifyParticipants(participants);

      // If other participants are present in the room and we are waiting to resolve:
      const others = participants.filter((p) => !p.isSelf);
      if (others.length > 0) {
        // Request state from room host/peers
        if (this.channel) {
          this.channel.send({
            type: 'broadcast',
            event: 'REQUEST_ROOM_STATE',
            payload: { requesterId: participant.id },
          });
        }

        // If host hasn't broadcasted state yet within 1.5s, create active session from presence
        setTimeout(() => {
          if (!isConnectResolved) {
            const hostUser = others.find((p) => p.isOwner) || others[0];
            const fallbackRoomState: SharedRoomState = {
              roomId: this.roomId || cleanRoom,
              roomName: `${hostUser?.name || 'AURA'}'s Room`,
              ownerId: hostUser?.id || 'host',
              ownerName: hostUser?.name || 'Host',
              currentTrack: null,
              queue: [],
              isPlaying: false,
              position: 0,
              playbackRate: 1,
              updatedAt: Date.now(),
              version: 1,
              lastAction: {
                type: 'PLAY',
                userName: hostUser?.name || 'Host',
                userId: hostUser?.id || 'host',
                description: 'is hosting the session',
                timestamp: Date.now(),
              },
            };
            resolveConnection(fallbackRoomState);
          }
        }, 1500);
      }
    });

    this.channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach((p: any) => {
        if (p.id !== participant.id) {
          this.notifyActivity({
            id: `join-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userName: p.name || 'Someone',
            actionText: 'joined the room',
            timestamp: Date.now(),
          });
        }
      });
    });

    this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((p: any) => {
        this.notifyActivity({
          id: `leave-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userName: p.name || 'Someone',
          actionText: 'left the room',
          timestamp: Date.now(),
        });
      });
    });

    // Subscribe to channel
    return new Promise((resolve) => {
      connectResolver = resolve;

      this.channel?.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.notifyStatus('CONNECTED');
          await this.channel?.track({
            id: participant.id,
            name: participant.name,
            joinedAt: participant.joinedAt,
            isOwner: participant.isOwner,
          });

          // Immediately announce self as participant
          this.notifyParticipants([
            {
              id: participant.id,
              name: participant.name,
              joinedAt: participant.joinedAt,
              isOwner: Boolean(participant.isOwner),
              isSelf: true,
            },
          ]);

          this.notifyActivity({
            id: `self-join-${Date.now()}`,
            userName: participant.name,
            actionText: 'entered the room',
            timestamp: Date.now(),
          });

          // Creator / Room Owner: resolves immediately with authoritative current state
          if (participant.isOwner && this.currentState) {
            resolveConnection(this.currentState);
            return;
          }

          // Guest / Joining Participant:
          // ALWAYS send REQUEST_ROOM_STATE to the active Host, even if this.currentState was loaded from DB!
          this.channel?.send({
            type: 'broadcast',
            event: 'REQUEST_ROOM_STATE',
            payload: { requesterId: participant.id },
          });

          // Fast retries at 250ms and 650ms for instant handshake with Host
          setTimeout(() => {
            if (!isConnectResolved && this.channel) {
              this.channel.send({
                type: 'broadcast',
                event: 'REQUEST_ROOM_STATE',
                payload: { requesterId: participant.id },
              });
            }
          }, 250);

          setTimeout(() => {
            if (!isConnectResolved && this.channel) {
              this.channel.send({
                type: 'broadcast',
                event: 'REQUEST_ROOM_STATE',
                payload: { requesterId: participant.id },
              });
            }
          }, 650);

          // Grace period timeout: If after 1200ms no active host responded
          setTimeout(() => {
            if (!isConnectResolved) {
              if (this.currentState) {
                // If database snapshot exists but host is not active, resolve with snapshot without extrapolating stale time
                resolveConnection(this.currentState);
              } else {
                const presenceState = this.channel?.presenceState() || {};
                const otherKeys = Object.keys(presenceState).filter((k) => k !== participant.id);
                if (otherKeys.length > 0) {
                  // Other users are in the room! Room is definitely open!
                  const fallbackRoomState: SharedRoomState = {
                    roomId: this.roomId || cleanRoom,
                    roomName: 'Shared Listening Room',
                    ownerId: otherKeys[0],
                    ownerName: 'Host',
                    currentTrack: null,
                    queue: [],
                    isPlaying: false,
                    position: 0,
                    playbackRate: 1,
                    updatedAt: Date.now(),
                    version: 1,
                  };
                  resolveConnection(fallbackRoomState);
                } else {
                  // Truly empty room with no active host
                  resolveConnection(null);
                }
              }
            }
          }, 3500);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.notifyStatus('RECONNECTING');
          setTimeout(() => {
            if (!isConnectResolved) {
              resolveConnection(null);
            }
          }, 3500);
        } else if (status === 'CLOSED') {
          this.notifyStatus('DISCONNECTED');
          if (!isConnectResolved) {
            resolveConnection(null);
          }
        }
      });
    });
  }

  public disconnect(): void {
    if (this.channel) {
      this.channel.untrack();
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.roomId = null;
    this.currentParticipant = null;
    this.currentState = null;
    this.notifyStatus('DISCONNECTED');
  }

  public async sendAction(action: RoomActionPayload): Promise<boolean> {
    if (!this.channel) return false;

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'PLAYBACK_ACTION',
        payload: action,
      });
      return true;
    } catch (err) {
      console.error('Failed to send broadcast action:', err);
      return false;
    }
  }

  public async updateRoomState(state: SharedRoomState): Promise<boolean> {
    if (!this.channel || !this.roomId) return false;

    // Bump version and timestamp
    const updatedState: SharedRoomState = {
      ...state,
      version: (this.currentState?.version || 0) + 1,
      updatedAt: Date.now(),
    };

    this.currentState = updatedState;
    this.notifyState(updatedState);

    if (updatedState.lastAction) {
      this.notifyActivity({
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userName: updatedState.lastAction.userName,
        actionText: updatedState.lastAction.description,
        timestamp: updatedState.lastAction.timestamp,
      });
    }

    try {
      // 1. Broadcast to all participants via realtime channel
      await this.channel.send({
        type: 'broadcast',
        event: 'ROOM_STATE_UPDATED',
        payload: updatedState,
      });

      // 2. Asynchronously persist to database table if connected
      if (this.client) {
        Promise.resolve(
          this.client.from('aura_room_state').upsert({
            room_id: updatedState.roomId,
            room_name: updatedState.roomName,
            owner_id: updatedState.ownerId,
            owner_name: updatedState.ownerName,
            current_track: updatedState.currentTrack,
            queue: updatedState.queue,
            is_playing: updatedState.isPlaying,
            position: updatedState.position,
            playback_rate: updatedState.playbackRate,
            updated_at: updatedState.updatedAt,
            version: updatedState.version,
            last_action: updatedState.lastAction,
          })
        ).catch(() => {});
      }

      return true;
    } catch (err) {
      console.error('Failed to update room state in Supabase:', err);
      return false;
    }
  }

  public onStateUpdate(listener: (state: SharedRoomState) => void): () => void {
    this.stateListeners.add(listener);
    if (this.currentState) listener(this.currentState);
    return () => this.stateListeners.delete(listener);
  }

  public onParticipantsUpdate(listener: (participants: RoomParticipant[]) => void): () => void {
    this.participantsListeners.add(listener);
    return () => this.participantsListeners.delete(listener);
  }

  public onActivity(listener: (activity: RoomActivityItem) => void): () => void {
    this.activityListeners.add(listener);
    return () => this.activityListeners.delete(listener);
  }

  public onStatusChange(listener: (status: RoomConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  public onChatMessage(listener: (message: RoomChatMessage) => void): () => void {
    this.chatListeners.add(listener);
    return () => this.chatListeners.delete(listener);
  }

  public async sendChatMessage(message: RoomChatMessage): Promise<boolean> {
    if (!this.channel) return false;
    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'CHAT_MESSAGE',
        payload: message,
      });
      return true;
    } catch (err) {
      console.warn('Failed to broadcast chat message via Supabase:', err);
      return false;
    }
  }

  private notifyState(state: SharedRoomState) {
    this.stateListeners.forEach((fn) => fn(state));
  }

  private notifyParticipants(participants: RoomParticipant[]) {
    this.participantsListeners.forEach((fn) => fn(participants));
  }

  private notifyActivity(activity: RoomActivityItem) {
    this.activityListeners.forEach((fn) => fn(activity));
  }

  private notifyStatus(status: RoomConnectionStatus) {
    this.statusListeners.forEach((fn) => fn(status));
  }

  private notifyChatMessage(message: RoomChatMessage) {
    this.chatListeners.forEach((fn) => fn(message));
  }

  private formatActionDescription(action: RoomActionPayload): string {
    switch (action.type) {
      case 'PLAY':
        return 'resumed playback';
      case 'PAUSE':
        return 'paused playback';
      case 'NEXT':
        return 'skipped to the next track';
      case 'PREVIOUS':
        return 'returned to previous track';
      case 'SEEK':
        return `seeked to ${Math.floor(action.data?.position || 0)}s`;
      case 'ADD_TRACK':
        return `added "${action.data?.track?.title || 'a track'}" to queue`;
      case 'REMOVE_TRACK':
        return 'removed a track from queue';
      case 'CHANGE_TRACK':
        return `changed track to "${action.data?.track?.title || 'track'}"`;
      default:
        return 'updated playback';
    }
  }
}
