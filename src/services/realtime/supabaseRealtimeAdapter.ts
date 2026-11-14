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
  RoomErrorPayload,
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
  private actionListeners = new Set<(action: RoomActionPayload) => void>();
  private errorListeners = new Set<(error: RoomErrorPayload) => void>();

  constructor() {
    this.client = getSupabaseClient();
  }

  public setLivePositionProvider(provider: LivePlaybackPositionProvider | null): void {
    this.livePositionProvider = provider;
  }

  public getVerifiedParticipantId(): string | null {
    return this.currentParticipant?.id || null;
  }

  private getAuthoritativeHostState(): SharedRoomState | null {
    if (!this.currentState) return null;
    const liveState = { ...this.currentState };

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
      } catch {
        // Ignore live provider read failure
      }
    }

    if (liveState.isPlaying && liveState.updatedAt) {
      const rawElapsed = (Date.now() - liveState.updatedAt) / 1000;
      const elapsed = Math.max(0, Math.min(3, rawElapsed)) * (liveState.playbackRate || 1);
      const maxDur = liveState.currentTrack?.duration || 999999;
      liveState.position = Math.min(maxDur, (liveState.position || 0) + elapsed);
      liveState.updatedAt = Date.now();
      this.currentState = liveState;
    }

    return liveState;
  }

  private async ensureAuthenticatedUid(): Promise<string> {
    if (!this.client) {
      throw new Error('Supabase client is not configured');
    }

    const { data: sessionData } = await this.client.auth.getSession();
    const existingUid = sessionData?.session?.user?.id;
    if (existingUid) {
      return existingUid;
    }

    const { data: anonData, error: anonError } = await this.client.auth.signInAnonymously();
    if (anonError || !anonData?.user?.id) {
      const msg =
        'Supabase Anonymous Authentication must be enabled under Authentication → Providers to use Supabase Listen Together rooms.';
      this.notifyError({ code: 'SUPABASE_ANON_AUTH_DISABLED', message: msg });
      throw new Error(msg);
    }

    return anonData.user.id;
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

    const cleanRoom = roomId.trim().toLowerCase();
    this.roomId = cleanRoom;
    this.notifyStatus('CONNECTING');

    // 1. Obtain verified Supabase auth.uid() required by scoped V2 RLS policies
    let verifiedUid: string;
    try {
      verifiedUid = await this.ensureAuthenticatedUid();
    } catch (err) {
      this.notifyStatus('DISCONNECTED');
      throw err;
    }

    const verifiedParticipant: RoomParticipant = {
      ...participant,
      id: verifiedUid,
      isSelf: true,
    };
    this.currentParticipant = verifiedParticipant;

    let normalizedInitialState: SharedRoomState | undefined;
    if (initialState) {
      normalizedInitialState = {
        ...initialState,
        roomId: cleanRoom,
        ownerId: verifiedUid,
        ownerName: verifiedParticipant.name,
      };
    }

    // 2. Check room ban list before joining
    try {
      const { data: banRow } = await this.client
        .from('aura_room_bans')
        .select('participant_id')
        .eq('room_id', cleanRoom)
        .eq('participant_id', verifiedUid)
        .maybeSingle();

      if (banRow) {
        this.notifyError({
          code: 'KICKED',
          message: 'You were removed from this room by the host.',
        });
        this.notifyStatus('ROOM_CLOSED');
        return null;
      }
    } catch {
      // Ban table may not be readable if user isn't owner/banned; continue
    }

    // 3. Enforce strict FK ordering: aura_rooms -> aura_room_members -> aura_room_state
    const now = Date.now();
    if (normalizedInitialState) {
      const { error: roomInsertErr } = await this.client.from('aura_rooms').upsert({
        id: cleanRoom,
        name: normalizedInitialState.roomName,
        owner_id: verifiedUid,
        owner_name: normalizedInitialState.ownerName,
        created_at: now,
        updated_at: now,
        status: 'active',
      });
      if (roomInsertErr) {
        this.notifyError({ code: 'ROOM_CREATE_FAILED', message: roomInsertErr.message });
      }
    }

    // Register current participant in aura_room_members before reading aura_room_state (RLS requirement)
    try {
      await this.client.from('aura_room_members').upsert({
        room_id: cleanRoom,
        participant_id: verifiedUid,
        display_name: verifiedParticipant.name,
        joined_at: verifiedParticipant.joinedAt || now,
        last_seen: now,
      });
    } catch {
      // Continue; realtime presence still operates
    }

    // 4. Fetch existing room state from database if available
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
          ownerId: data.owner_id || verifiedUid,
          ownerName: data.owner_name || verifiedParticipant.name,
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
      // Continue
    }

    // If creating a room and no state row exists yet, persist initial state as verified owner
    if (!loadedState && normalizedInitialState) {
      loadedState = normalizedInitialState;
      try {
        await this.client.from('aura_room_state').upsert({
          room_id: normalizedInitialState.roomId,
          room_name: normalizedInitialState.roomName,
          owner_id: verifiedUid,
          owner_name: normalizedInitialState.ownerName,
          current_track: normalizedInitialState.currentTrack,
          queue: normalizedInitialState.queue,
          is_playing: normalizedInitialState.isPlaying,
          position: normalizedInitialState.position,
          playback_rate: normalizedInitialState.playbackRate,
          updated_at: normalizedInitialState.updatedAt,
          version: normalizedInitialState.version,
          last_action: normalizedInitialState.lastAction,
        });
      } catch {
        // Continue with memory state
      }
    }

    if (loadedState) {
      this.currentState = loadedState;
    }

    // 5. Setup Supabase Realtime Channel
    const channelName = `aura-room:${cleanRoom}`;
    this.channel = this.client.channel(channelName, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: verifiedUid },
      },
    });

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

    // Listen for broadcasted state updates (reject updates claiming a mismatched room)
    this.channel.on('broadcast', { event: 'ROOM_STATE_UPDATED' }, ({ payload }) => {
      const incomingState = payload as SharedRoomState;
      if (!incomingState || (incomingState.roomId && incomingState.roomId.toLowerCase() !== this.roomId)) return;

      const isFreshHostSync = Math.abs(Date.now() - (incomingState.updatedAt || 0)) < 4000;
      if (this.currentState && incomingState.version < this.currentState.version && !isFreshHostSync) {
        return;
      }

      this.currentState = incomingState;
      this.notifyState(incomingState);
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

    // Host replies to REQUEST_ROOM_STATE
    this.channel.on('broadcast', { event: 'REQUEST_ROOM_STATE' }, () => {
      const isOwner =
        this.currentParticipant &&
        this.currentState &&
        this.currentState.ownerId === this.currentParticipant.id;

      if (isOwner && this.channel && this.currentState) {
        const liveState = this.getAuthoritativeHostState();
        if (liveState) {
          this.channel.send({
            type: 'broadcast',
            event: 'ROOM_STATE_UPDATED',
            payload: liveState,
          });
        }
      }
    });

    // Listen for collaborative actions and let host reduce them authoritatively
    this.channel.on('broadcast', { event: 'PLAYBACK_ACTION' }, ({ payload }) => {
      const action = payload as RoomActionPayload;
      if (!action) return;

      this.notifyActivity({
        id: action.actionId,
        userName: action.userName,
        actionText: this.formatActionDescription(action),
        timestamp: action.timestamp,
      });

      this.actionListeners.forEach((fn) => fn(action));
    });

    // Listen for host kick events
    this.channel.on('broadcast', { event: 'PARTICIPANT_KICKED' }, ({ payload }) => {
      const targetId = payload?.targetUserId;
      if (targetId && this.currentParticipant && targetId === this.currentParticipant.id) {
        this.notifyError({
          code: 'KICKED',
          message: 'You were removed from the room by the host.',
        });
        this.notifyStatus('ROOM_CLOSED');
        this.disconnect();
      }
    });

    // Listen for room chat messages
    this.channel.on('broadcast', { event: 'CHAT_MESSAGE' }, ({ payload }) => {
      const msg = payload as RoomChatMessage;
      if (!msg || (msg.roomId && msg.roomId.toLowerCase() !== this.roomId)) return;
      this.notifyChatMessage(msg);
    });

    // Presence sync
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
            isOwner: this.currentState ? key === this.currentState.ownerId : Boolean(p.isOwner),
            isSelf: key === verifiedUid,
          });
        }
      });

      this.notifyParticipants(participants);

      const others = participants.filter((p) => !p.isSelf);
      if (others.length > 0 && !isConnectResolved) {
        this.channel.send({
          type: 'broadcast',
          event: 'REQUEST_ROOM_STATE',
          payload: { requesterId: verifiedUid },
        });
      }
    });

    this.channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach((p: any) => {
        if (p.id !== verifiedUid) {
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

    return new Promise((resolve) => {
      connectResolver = resolve;

      this.channel?.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.notifyStatus('CONNECTED');
          await this.channel?.track({
            id: verifiedUid,
            name: verifiedParticipant.name,
            joinedAt: verifiedParticipant.joinedAt,
            isOwner: Boolean(normalizedInitialState),
          });

          this.notifyParticipants([
            {
              ...verifiedParticipant,
              isOwner: Boolean(normalizedInitialState),
            },
          ]);

          this.notifyActivity({
            id: `self-join-${Date.now()}`,
            userName: verifiedParticipant.name,
            actionText: 'entered the room',
            timestamp: Date.now(),
          });

          if (normalizedInitialState && this.currentState) {
            resolveConnection(this.currentState);
            return;
          }

          this.channel?.send({
            type: 'broadcast',
            event: 'REQUEST_ROOM_STATE',
            payload: { requesterId: verifiedUid },
          });

          setTimeout(() => {
            if (!isConnectResolved && this.channel) {
              this.channel.send({
                type: 'broadcast',
                event: 'REQUEST_ROOM_STATE',
                payload: { requesterId: verifiedUid },
              });
            }
          }, 300);

          setTimeout(() => {
            if (!isConnectResolved) {
              if (this.currentState) {
                resolveConnection(this.currentState);
              } else {
                const presenceState = this.channel?.presenceState() || {};
                const otherKeys = Object.keys(presenceState).filter((k) => k !== verifiedUid);
                if (otherKeys.length > 0) {
                  resolveConnection({
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
                  });
                } else {
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
    const cleanRoom = this.roomId;
    const uid = this.currentParticipant?.id;
    if (this.client && cleanRoom && uid) {
      Promise.resolve(
        this.client.from('aura_room_members').delete().eq('room_id', cleanRoom).eq('participant_id', uid)
      ).catch(() => {});
    }
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
    if (!this.channel || !this.currentParticipant) return false;

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'PLAYBACK_ACTION',
        payload: {
          ...action,
          userId: this.currentParticipant.id,
          userName: this.currentParticipant.name,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  public async updateRoomState(state: SharedRoomState): Promise<boolean> {
    if (!this.channel || !this.roomId || !this.currentParticipant) return false;

    // Host-authoritative write check
    if (this.currentParticipant.id !== state.ownerId) {
      return false;
    }

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
      await this.channel.send({
        type: 'broadcast',
        event: 'ROOM_STATE_UPDATED',
        payload: updatedState,
      });

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
    } catch {
      return false;
    }
  }

  public async kickParticipant(targetUserId: string): Promise<boolean> {
    if (!this.client || !this.channel || !this.roomId || !this.currentParticipant || !this.currentState) {
      return false;
    }
    if (this.currentParticipant.id !== this.currentState.ownerId || targetUserId === this.currentParticipant.id) {
      return false;
    }

    try {
      await this.client.from('aura_room_bans').upsert({
        room_id: this.roomId,
        participant_id: targetUserId,
        banned_at: Date.now(),
      });
      await this.client
        .from('aura_room_members')
        .delete()
        .eq('room_id', this.roomId)
        .eq('participant_id', targetUserId);
      await this.channel.send({
        type: 'broadcast',
        event: 'PARTICIPANT_KICKED',
        payload: { targetUserId },
      });
      return true;
    } catch {
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

  public onAction(listener: (action: RoomActionPayload) => void): () => void {
    this.actionListeners.add(listener);
    return () => this.actionListeners.delete(listener);
  }

  public onError(listener: (error: RoomErrorPayload) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  public async sendChatMessage(message: RoomChatMessage): Promise<boolean> {
    if (!this.channel || !this.currentParticipant) return false;
    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'CHAT_MESSAGE',
        payload: {
          ...message,
          senderId: this.currentParticipant.id,
          senderName: this.currentParticipant.name,
        },
      });
      return true;
    } catch {
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

  private notifyError(error: RoomErrorPayload) {
    this.errorListeners.forEach((fn) => fn(error));
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
