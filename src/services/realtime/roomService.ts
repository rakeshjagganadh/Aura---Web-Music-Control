import {
  IRoomRealtimeAdapter,
  LivePlaybackPositionProvider,
  RealtimeBackendType,
  RoomActionPayload,
  RoomActionType,
  RoomActivityItem,
  RoomChatMessage,
  RoomConnectionStatus,
  RoomErrorPayload,
  RoomParticipant,
  SharedRoomState,
  SharedRoomTrack,
} from './types';
import { isSupabaseConfigured } from './supabaseClient';
import { SupabaseRealtimeAdapter } from './supabaseRealtimeAdapter';
import { DirectRealtimeAdapter } from './directRealtimeAdapter';

const LOCAL_STORAGE_USER_NAME_KEY = 'aura_listen_together_username';
const LOCAL_STORAGE_USER_ID_KEY = 'aura_listen_together_userid';

class RoomService {
  private adapter: IRoomRealtimeAdapter | null = null;
  private currentRoomId: string | null = null;
  private currentParticipant: RoomParticipant | null = null;
  private latestState: SharedRoomState | null = null;
  private processedActionIds = new Set<string>();
  private livePositionProvider: LivePlaybackPositionProvider | null = null;

  // Persistent event listeners that stay alive even before an adapter is created
  private stateListeners = new Set<(state: SharedRoomState) => void>();
  private participantsListeners = new Set<(participants: RoomParticipant[]) => void>();
  private activityListeners = new Set<(activity: RoomActivityItem) => void>();
  private statusListeners = new Set<(status: RoomConnectionStatus) => void>();
  private chatListeners = new Set<(message: RoomChatMessage) => void>();
  private errorListeners = new Set<(error: RoomErrorPayload) => void>();
  private adapterUnsubscribers: (() => void)[] = [];

  // Local clock-skew anchor: tracks local arrival time to prevent cross-device NTP clock differences (e.g. 33s fast jump)
  private localSyncAnchor: {
    trackId: string | null;
    version: number;
    position: number;
    isPlaying: boolean;
    localAnchorTime: number;
  } | null = null;

  // Drift and synchronization settings (prompt section 13)
  public readonly DRIFT_TOLERANCE_LOW = 0.35; // < 350ms: do nothing
  public readonly DRIFT_TOLERANCE_MED = 0.70; // > 700ms: gentle correction
  public readonly DRIFT_TOLERANCE_HIGH = 1.20; // > 1.2s: strong seek

  /**
   * Generates a clean, readable and unpredictable room code
   * Example: "aura-8f2k9a"
   */
  public generateRoomId(): string {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Sanitizes user input, room code, or full URL to extract the room ID
   */
  public cleanRoomCode(input: string): string {
    if (!input || typeof input !== 'string') return '';
    let clean = input.trim();

    // If query string with room=
    try {
      if (clean.includes('?room=') || clean.includes('&room=')) {
        const base = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://app.internal';
        const parsed = new URL(clean.startsWith('http') ? clean : `${base}/${clean.replace(/^\/+/, '')}`);
        const r = parsed.searchParams.get('room');
        if (r) return r.trim().toLowerCase();
      }
    } catch {
      // Ignore URL parse failure
    }

    // If path with /listen/
    if (clean.includes('/listen/')) {
      const parts = clean.split('/listen/');
      if (parts[1]) {
        return parts[1].split('?')[0].split('#')[0].replace(/\/$/, '').trim().toLowerCase();
      }
    }

    // Strip leading hash or slash and lowercase
    clean = clean.replace(/^[#/]+/, '').trim().toLowerCase();
    return clean;
  }

  /**
   * Generates full shareable URL using current window origin
   * Returns https://<current-origin>/listen/<roomId>
   */
  public getShareableUrl(roomId: string): string {
    const clean = this.cleanRoomCode(roomId);
    if (typeof window === 'undefined') return `/listen/${clean}`;
    return `${window.location.origin}/listen/${clean}`;
  }

  /**
   * Retrieves or creates a persistent anonymous participant identity
   */
  public getOrCreateUserIdentity(preferredName?: string): { id: string; name: string } {
    let id = '';
    let name = '';

    if (typeof window !== 'undefined') {
      id = localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY) || '';
      name = localStorage.getItem(LOCAL_STORAGE_USER_NAME_KEY) || '';

      if (!id) {
        id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, id);
      }

      if (preferredName && preferredName.trim()) {
        name = preferredName.trim();
        localStorage.setItem(LOCAL_STORAGE_USER_NAME_KEY, name);
      } else if (!name) {
        name = 'Listener';
      }
    } else {
      id = `user_${Date.now()}`;
      name = preferredName || 'Listener';
    }

    return { id, name };
  }

  public setDisplayName(name: string): void {
    if (typeof window !== 'undefined' && name.trim()) {
      localStorage.setItem(LOCAL_STORAGE_USER_NAME_KEY, name.trim());
      if (this.currentParticipant) {
        this.currentParticipant.name = name.trim();
      }
    }
  }

  public getCurrentParticipant(): RoomParticipant | null {
    return this.currentParticipant;
  }

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  public getBackendType(): RealtimeBackendType {
    return this.adapter?.backendType || (isSupabaseConfigured() ? 'supabase' : 'websocket');
  }

  /**
   * Creates and initializes a new listening room
   */
  public async createRoom(
    roomName: string,
    initialTrack: SharedRoomTrack | null = null,
    creatorName?: string
  ): Promise<{ roomId: string; state: SharedRoomState }> {
    const roomId = this.generateRoomId();
    const identity = this.getOrCreateUserIdentity(creatorName);

    const participant: RoomParticipant = {
      id: identity.id,
      name: identity.name,
      joinedAt: Date.now(),
      isOwner: true,
      isSelf: true,
    };

    const initialState: SharedRoomState = {
      roomId,
      roomName: roomName.trim() || 'AURA Shared Room',
      ownerId: identity.id,
      ownerName: identity.name,
      currentTrack: initialTrack,
      queue: initialTrack ? [initialTrack] : [],
      isPlaying: false,
      position: 0,
      playbackRate: 1,
      updatedAt: Date.now(),
      version: 1,
      lastAction: {
        type: 'PLAY',
        userName: identity.name,
        userId: identity.id,
        description: 'created the listening room',
        timestamp: Date.now(),
      },
    };

    const connectedState = await this.joinRoom(roomId, participant, initialState);
    return { roomId, state: connectedState || initialState };
  }

  /**
   * Joins an existing listening room
   */
  public async joinRoom(
    roomId: string,
    participantData?: Partial<RoomParticipant>,
    initialState?: SharedRoomState
  ): Promise<SharedRoomState | null> {
    this.leaveRoom();

    const identity = this.getOrCreateUserIdentity(participantData?.name);
    const participant: RoomParticipant = {
      id: identity.id,
      name: identity.name,
      joinedAt: Date.now(),
      isOwner: participantData?.isOwner ?? false,
      isSelf: true,
    };

    const cleanRoomId = this.cleanRoomCode(roomId);
    this.currentRoomId = cleanRoomId;
    this.currentParticipant = participant;

    // Factory: select adapter
    if (isSupabaseConfigured()) {
      this.adapter = new SupabaseRealtimeAdapter();
    } else {
      this.adapter = new DirectRealtimeAdapter();
    }

    // Clean up previous adapter subscriptions
    this.adapterUnsubscribers.forEach((unsub) => unsub());
    this.adapterUnsubscribers = [];

    // Wire newly created adapter to persistent RoomService listeners
    if (this.adapter.setLivePositionProvider) {
      this.adapter.setLivePositionProvider(this.livePositionProvider);
    }

    this.adapterUnsubscribers.push(
      this.adapter.onStateUpdate((state) => {
        this.latestState = state;
        this.updateSyncAnchor(state);
        if (this.currentParticipant && state.ownerId === this.currentParticipant.id) {
          this.currentParticipant.isOwner = true;
        }
        this.stateListeners.forEach((fn) => fn(state));
      }),
      this.adapter.onParticipantsUpdate((participants) => {
        this.participantsListeners.forEach((fn) => fn(participants));
      }),
      this.adapter.onActivity((activity) => {
        this.activityListeners.forEach((fn) => fn(activity));
      }),
      this.adapter.onStatusChange((status) => {
        this.statusListeners.forEach((fn) => fn(status));
      })
    );

    if (this.adapter.onChatMessage) {
      this.adapterUnsubscribers.push(
        this.adapter.onChatMessage((chatMsg) => {
          this.chatListeners.forEach((fn) => fn(chatMsg));
        })
      );
    }

    if (this.adapter.onError) {
      this.adapterUnsubscribers.push(
        this.adapter.onError((err) => {
          this.errorListeners.forEach((fn) => fn(err));
        })
      );
    }

    if (this.adapter.onAction) {
      this.adapterUnsubscribers.push(
        this.adapter.onAction((incomingAction) => {
          // Host authoritatively reduces collaborative guest actions in serverless Supabase mode
          if (
            this.latestState &&
            this.currentParticipant &&
            this.latestState.ownerId === this.currentParticipant.id &&
            this.adapter
          ) {
            const hostOnlyTypes = new Set<RoomActionType>(['SEEK', 'REMOVE_TRACK', 'REORDER_QUEUE']);
            if (hostOnlyTypes.has(incomingAction.type) && incomingAction.userId !== this.latestState.ownerId) {
              return;
            }
            const nextState = this.reduceStateWithAction(this.latestState, incomingAction);
            this.latestState = nextState;
            this.updateSyncAnchor(nextState);
            this.adapter.updateRoomState(nextState);
          }
        })
      );
    }

    const state = await this.adapter.connect(cleanRoomId, participant, initialState);
    const verifiedId = this.adapter.getVerifiedParticipantId?.();
    if (verifiedId && this.currentParticipant) {
      this.currentParticipant.id = verifiedId;
    }
    if (state) {
      this.latestState = state;
      if (this.currentParticipant && state.ownerId === this.currentParticipant.id) {
        this.currentParticipant.isOwner = true;
      }
      this.updateSyncAnchor(state);
    }
    return state;
  }

  public setLivePositionProvider(provider: LivePlaybackPositionProvider | null): void {
    this.livePositionProvider = provider;
    if (this.adapter && typeof this.adapter.setLivePositionProvider === 'function') {
      this.adapter.setLivePositionProvider(provider);
    }
  }

  public getLivePosition(): number | null {
    if (this.livePositionProvider) {
      try {
        const live = this.livePositionProvider();
        if (live && typeof live.position === 'number' && !isNaN(live.position)) {
          return live.position;
        }
      } catch {}
    }
    return null;
  }

  /**
   * Records or updates local arrival anchor, taking into account elapsed time since state.updatedAt.
   * Stale states (> 3s old, such as database snapshots) are not extrapolated into the future.
   */
  private updateSyncAnchor(state: SharedRoomState): void {
    if (!state.currentTrack) {
      this.localSyncAnchor = null;
      return;
    }

    const rawElapsed = (Date.now() - (state.updatedAt || Date.now())) / 1000;
    // Account for small network transit time only if state was freshly generated (< 3s ago)
    const elapsedSinceUpdate =
      state.isPlaying && rawElapsed >= 0 && rawElapsed < 3
        ? rawElapsed * (state.playbackRate || 1)
        : 0;

    const computedPosition = (state.position || 0) + elapsedSinceUpdate;
    const maxDuration = state.currentTrack?.duration || 999999;
    const anchorPosition = Math.min(maxDuration, Math.max(0, computedPosition));

    this.localSyncAnchor = {
      trackId: state.currentTrack.id,
      version: state.version,
      position: anchorPosition,
      isPlaying: state.isPlaying,
      localAnchorTime: Date.now(),
    };
  }

  public leaveRoom(): void {
    this.adapterUnsubscribers.forEach((unsub) => unsub());
    this.adapterUnsubscribers = [];

    if (this.adapter) {
      this.adapter.disconnect();
      this.adapter = null;
    }
    this.currentRoomId = null;
    this.currentParticipant = null;
    this.latestState = null;
    this.processedActionIds.clear();
    this.localSyncAnchor = null;

    this.participantsListeners.forEach((fn) => fn([]));
    this.statusListeners.forEach((fn) => fn('DISCONNECTED'));
  }

  /**
   * Calculates the authoritative room position given elapsed time
   * Uses local arrival anchor to eliminate cross-device NTP / phone clock skew
   */
  public calculateCurrentPosition(state: SharedRoomState): number {
    if (!state.isPlaying) {
      return Math.max(0, state.position || 0);
    }

    let elapsedSeconds = 0;

    // 1. If we have a local arrival anchor for this state version, calculate elapsed time using local monotonic time
    if (
      this.localSyncAnchor &&
      this.localSyncAnchor.trackId === (state.currentTrack?.id || null) &&
      this.localSyncAnchor.version === state.version
    ) {
      elapsedSeconds = Math.max(0, (Date.now() - this.localSyncAnchor.localAnchorTime) / 1000);
      const computed = this.localSyncAnchor.position + elapsedSeconds * (state.playbackRate || 1);
      const maxDuration = state.currentTrack?.duration || 999999;
      return Math.max(0, Math.min(maxDuration, computed));
    }

    // 2. Fallback: calculate using state.updatedAt with clock-skew protection
    const rawElapsed = (Date.now() - (state.updatedAt || Date.now())) / 1000;
    // Guard against stale snapshots (e.g. database rows loaded on join)
    elapsedSeconds = rawElapsed >= 0 && rawElapsed < 3 ? rawElapsed : 0;

    const computed = (state.position || 0) + elapsedSeconds * (state.playbackRate || 1);
    const maxDuration = state.currentTrack?.duration || 999999;
    return Math.max(0, Math.min(maxDuration, computed));
  }

  /**
   * Dispatches an action idempotently
   */
  public async dispatchAction(
    type: RoomActionType,
    data?: RoomActionPayload['data'],
    currentState?: SharedRoomState
  ): Promise<boolean> {
    if (!this.adapter || !this.currentRoomId || !this.currentParticipant) {
      return false;
    }

    const isHost = Boolean(currentState && currentState.ownerId === this.currentParticipant.id);

    // Host-authoritative action guard: only host may seek, remove, or reorder queue
    const hostOnlyTypes = new Set<RoomActionType>(['SEEK', 'REMOVE_TRACK', 'REORDER_QUEUE']);
    if (hostOnlyTypes.has(type) && !isHost) {
      return false;
    }

    const actionId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.processedActionIds.add(actionId);

    const action: RoomActionPayload = {
      actionId,
      type,
      userId: this.currentParticipant.id,
      userName: this.currentParticipant.name,
      timestamp: Date.now(),
      data,
    };

    // In WebSocket mode, server reducer is always authoritative; in Supabase mode, Host reduces & updates state
    if (this.adapter.backendType === 'websocket') {
      return this.adapter.sendAction(action);
    }

    if (currentState && isHost) {
      const nextState = this.reduceStateWithAction(currentState, action);
      this.latestState = nextState;
      this.localSyncAnchor = {
        trackId: nextState.currentTrack?.id || null,
        version: nextState.version,
        position: nextState.position,
        isPlaying: nextState.isPlaying,
        localAnchorTime: Date.now(),
      };
      return this.adapter.updateRoomState(nextState);
    }

    return this.adapter.sendAction(action);
  }

  public async kickParticipant(targetUserId: string): Promise<boolean> {
    if (!this.adapter?.kickParticipant || !this.currentParticipant?.isOwner) {
      return false;
    }
    return this.adapter.kickParticipant(targetUserId);
  }

  /**
   * State reducer ensuring server/client consistency
   */
  public reduceStateWithAction(state: SharedRoomState, action: RoomActionPayload): SharedRoomState {
    const updated: SharedRoomState = { ...state };
    const now = Date.now();

    const getBestPosition = () => {
      const live = this.livePositionProvider?.();
      if (live && typeof live.position === 'number' && !isNaN(live.position)) {
        return Math.max(0, live.position);
      }
      return this.calculateCurrentPosition(state);
    };

    // Preserve and advance authoritative playback position if a track is currently playing
    if (state.isPlaying && state.currentTrack) {
      const currentPos = getBestPosition();
      updated.position = currentPos;
      updated.updatedAt = now;
    }

    switch (action.type) {
      case 'PLAY': {
        const currentPos = getBestPosition();
        updated.isPlaying = true;
        updated.position = currentPos;
        updated.updatedAt = now;
        updated.lastAction = {
          type: 'PLAY',
          userId: action.userId,
          userName: action.userName,
          description: 'resumed playback',
          timestamp: now,
        };
        break;
      }

      case 'PAUSE': {
        const currentPos = getBestPosition();
        updated.isPlaying = false;
        updated.position = currentPos;
        updated.updatedAt = now;
        updated.lastAction = {
          type: 'PAUSE',
          userId: action.userId,
          userName: action.userName,
          description: 'paused playback',
          timestamp: now,
        };
        break;
      }

      case 'SEEK': {
        const targetPos = action.data?.position ?? 0;
        updated.position = Math.max(0, targetPos);
        updated.updatedAt = now;
        updated.lastAction = {
          type: 'SEEK',
          userId: action.userId,
          userName: action.userName,
          description: `seeked to ${Math.floor(targetPos)}s`,
          timestamp: now,
        };
        break;
      }

      case 'NEXT': {
        if (state.queue.length > 0) {
          const currentIndex = state.currentTrack
            ? state.queue.findIndex((t) => t.id === state.currentTrack?.id)
            : -1;
          const nextIndex = (currentIndex + 1) % state.queue.length;
          const nextTrack = state.queue[nextIndex];
          updated.currentTrack = nextTrack;
          updated.position = 0;
          updated.isPlaying = true;
          updated.updatedAt = now;
          updated.lastAction = {
            type: 'NEXT',
            userId: action.userId,
            userName: action.userName,
            description: `skipped to "${nextTrack.title}"`,
            timestamp: now,
          };
        }
        break;
      }

      case 'PREVIOUS': {
        if (state.queue.length > 0) {
          const currentIndex = state.currentTrack
            ? state.queue.findIndex((t) => t.id === state.currentTrack?.id)
            : -1;
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : state.queue.length - 1;
          const prevTrack = state.queue[prevIndex];
          updated.currentTrack = prevTrack;
          updated.position = 0;
          updated.isPlaying = true;
          updated.updatedAt = now;
          updated.lastAction = {
            type: 'PREVIOUS',
            userId: action.userId,
            userName: action.userName,
            description: `switched back to "${prevTrack.title}"`,
            timestamp: now,
          };
        }
        break;
      }

      case 'CHANGE_TRACK': {
        if (action.data?.track) {
          const newTrack = action.data.track;
          updated.currentTrack = newTrack;
          updated.position = 0;
          updated.isPlaying = true;
          updated.updatedAt = now;

          // Ensure track is in queue
          if (!updated.queue.some((t) => t.id === newTrack.id)) {
            updated.queue = [...updated.queue, newTrack];
          }

          updated.lastAction = {
            type: 'CHANGE_TRACK',
            userId: action.userId,
            userName: action.userName,
            description: `played "${newTrack.title}"`,
            timestamp: now,
          };
        }
        break;
      }

      case 'ADD_TRACK': {
        if (action.data?.track) {
          const trackToAdd = action.data.track;
          // Avoid duplicate addition if already present
          if (!updated.queue.some((t) => t.id === trackToAdd.id)) {
            updated.queue = [...updated.queue, trackToAdd];
          }

          // If no track was playing, make this the current track
          if (!updated.currentTrack) {
            updated.currentTrack = trackToAdd;
            updated.position = 0;
            updated.isPlaying = true;
            updated.updatedAt = now;
          }

          updated.lastAction = {
            type: 'ADD_TRACK',
            userId: action.userId,
            userName: action.userName,
            description: `added "${trackToAdd.title}" to queue`,
            timestamp: now,
          };
        }
        break;
      }

      case 'REMOVE_TRACK': {
        if (action.data?.trackId) {
          const idToRemove = action.data.trackId;
          updated.queue = updated.queue.filter((t) => t.id !== idToRemove);

          if (updated.currentTrack?.id === idToRemove) {
            updated.currentTrack = updated.queue[0] || null;
            updated.position = 0;
            updated.updatedAt = now;
          }

          updated.lastAction = {
            type: 'REMOVE_TRACK',
            userId: action.userId,
            userName: action.userName,
            description: 'removed a track from queue',
            timestamp: now,
          };
        }
        break;
      }

      case 'REORDER_QUEUE': {
        if (action.data?.queue) {
          updated.queue = action.data.queue;
          updated.lastAction = {
            type: 'REORDER_QUEUE',
            userId: action.userId,
            userName: action.userName,
            description: 'reordered the queue',
            timestamp: now,
          };
        }
        break;
      }

      default:
        break;
    }

    return updated;
  }

  // Event subscriptions (persistent across room transitions)
  public onStateUpdate(listener: (state: SharedRoomState) => void): () => void {
    this.stateListeners.add(listener);
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

  public onError(listener: (error: RoomErrorPayload) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  public async sendChatMessage(text: string): Promise<boolean> {
    if (!this.adapter || !this.currentRoomId || !this.currentParticipant) {
      return false;
    }

    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 500) {
      return false;
    }

    const isOwner = Boolean(this.currentParticipant.isOwner);

    const msg: RoomChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      roomId: this.currentRoomId,
      senderId: this.currentParticipant.id,
      senderName: this.currentParticipant.name,
      text: trimmed,
      timestamp: Date.now(),
      isHost: isOwner,
    };

    // Optimistically notify local listeners so sender sees message immediately
    this.chatListeners.forEach((fn) => fn(msg));

    if (this.adapter.sendChatMessage) {
      await this.adapter.sendChatMessage(msg);
    }
    return true;
  }
}

export const roomService = new RoomService();
