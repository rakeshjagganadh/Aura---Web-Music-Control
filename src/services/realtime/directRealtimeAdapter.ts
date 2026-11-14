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

interface SocketMessage {
  type:
    | 'JOIN'
    | 'STATE_UPDATE'
    | 'ACTION'
    | 'SYNC_REQUEST'
    | 'PING'
    | 'PARTICIPANTS'
    | 'CHAT_MESSAGE'
    | 'MODERATE_KICK'
    | 'ERROR';
  roomId: string;
  senderId: string;
  payload?: any;
}

const SESSION_TOKEN_PREFIX = 'aura_room_ws_token_';

export class DirectRealtimeAdapter implements IRoomRealtimeAdapter {
  public backendType: RealtimeBackendType = 'websocket';

  private socket: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private roomId: string | null = null;
  private currentParticipant: RoomParticipant | null = null;
  private currentState: SharedRoomState | null = null;
  private participants: Map<string, RoomParticipant> = new Map();
  private livePositionProvider: LivePlaybackPositionProvider | null = null;
  private sessionToken: string | null = null;
  private shouldReconnect = true;
  private wsFallbackActive = false;

  private stateListeners = new Set<(state: SharedRoomState) => void>();
  private participantsListeners = new Set<(participants: RoomParticipant[]) => void>();
  private activityListeners = new Set<(activity: RoomActivityItem) => void>();
  private statusListeners = new Set<(status: RoomConnectionStatus) => void>();
  private chatListeners = new Set<(message: RoomChatMessage) => void>();
  private errorListeners = new Set<(error: RoomErrorPayload) => void>();

  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

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

  private getStoredToken(roomId: string): string {
    if (typeof window === 'undefined') return '';
    try {
      return window.sessionStorage.getItem(`${SESSION_TOKEN_PREFIX}${roomId}`) || '';
    } catch {
      return '';
    }
  }

  private storeToken(roomId: string, token: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.setItem(`${SESSION_TOKEN_PREFIX}${roomId}`, token);
    } catch {
      // Ignore storage quota errors
    }
  }

  public async connect(
    roomId: string,
    participant: RoomParticipant,
    initialState?: SharedRoomState
  ): Promise<SharedRoomState | null> {
    const cleanRoom = roomId.trim().toLowerCase();
    this.roomId = cleanRoom;
    this.currentParticipant = { ...participant };
    this.shouldReconnect = true;
    this.wsFallbackActive = false;
    this.notifyStatus('CONNECTING');

    if (initialState) {
      this.currentState = { ...initialState };
    }

    // Acquire server-signed HMAC session/host token before WS handshake
    let tokenAcquired = false;
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/room-auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: cleanRoom,
            mode: initialState ? 'create' : 'join',
            displayName: participant.name,
            previousToken: this.getStoredToken(cleanRoom),
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const message = data?.error || 'Unable to authenticate with room server.';
          this.shouldReconnect = false;
          this.notifyError({
            code: res.status === 403 ? 'KICKED' : 'AUTH_REJECTED',
            message,
          });
          this.notifyStatus(res.status === 403 ? 'ROOM_CLOSED' : 'ROOM_NOT_FOUND');
          return null;
        }

        if (data?.token && data?.userId) {
          this.sessionToken = String(data.token);
          this.storeToken(cleanRoom, this.sessionToken);
          this.currentParticipant = {
            ...participant,
            id: String(data.userId),
            name: String(data.userName || participant.name),
            isOwner: data.role === 'host',
          };
          if (this.currentState && data.role === 'host') {
            this.currentState = {
              ...this.currentState,
              ownerId: String(data.userId),
              ownerName: String(data.userName || participant.name),
            };
          }
          tokenAcquired = true;
        }
      } catch {
        // Server endpoint unreachable (offline/static preview): allow BroadcastChannel fallback
        this.wsFallbackActive = true;
      }
    }

    if (this.wsFallbackActive || !tokenAcquired) {
      this.backendType = 'broadcast';
      this.initBroadcastChannel(cleanRoom);
      if (this.currentState) {
        this.notifyStatus('CONNECTED');
        return this.currentState;
      }
      return this.waitForBroadcastFallbackState();
    }

    return new Promise((resolve) => {
      let resolved = false;
      const safeResolve = (st: SharedRoomState | null) => {
        if (!resolved) {
          resolved = true;
          if (st) this.currentState = st;
          resolve(st);
        }
      };

      this.initWebSocket(safeResolve);

      if (this.currentState) {
        safeResolve(this.currentState);
        return;
      }

      setTimeout(() => {
        if (!resolved && this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(
            JSON.stringify({
              type: 'SYNC_REQUEST',
              roomId: this.roomId!,
              senderId: this.currentParticipant!.id,
            })
          );
        }
      }, 300);

      setTimeout(() => {
        if (!resolved) {
          safeResolve(this.currentState || null);
        }
      }, 3500);
    });
  }

  private initBroadcastChannel(cleanRoom: string) {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(`aura-room-${cleanRoom}`);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
        if (this.currentParticipant) {
          this.broadcastLocally({
            type: 'JOIN',
            roomId: cleanRoom,
            senderId: this.currentParticipant.id,
            payload: { participant: this.currentParticipant },
          });
        }
      }
    } catch {
      // BroadcastChannel unavailable
    }
  }

  private waitForBroadcastFallbackState(): Promise<SharedRoomState | null> {
    return new Promise((resolve) => {
      let resolved = false;
      const unsub = this.onStateUpdate((st) => {
        if (!resolved) {
          resolved = true;
          unsub();
          resolve(st);
        }
      });

      if (this.currentParticipant && this.roomId) {
        this.broadcastLocally({
          type: 'SYNC_REQUEST',
          roomId: this.roomId,
          senderId: this.currentParticipant.id,
        });
      }

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          unsub();
          if (this.currentState) {
            this.notifyStatus('CONNECTED');
            resolve(this.currentState);
          } else {
            this.notifyStatus('ROOM_NOT_FOUND');
            resolve(null);
          }
        }
      }, 1500);
    });
  }

  private initWebSocket(resolveInitialPromise?: (state: SharedRoomState | null) => void) {
    if (typeof window === 'undefined' || !this.sessionToken || !this.roomId) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/room-ws?room=${encodeURIComponent(this.roomId)}&token=${encodeURIComponent(this.sessionToken)}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.notifyStatus('CONNECTED');
        this.backendType = 'websocket';

        const joinMsg: SocketMessage = {
          type: 'JOIN',
          roomId: this.roomId!,
          senderId: this.currentParticipant!.id,
          payload: {
            initialState: this.currentParticipant?.isOwner ? this.currentState : undefined,
          },
        };
        this.socket?.send(JSON.stringify(joinMsg));

        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(
              JSON.stringify({
                type: 'PING',
                roomId: this.roomId,
                senderId: this.currentParticipant?.id,
              })
            );
          }
        }, 15000);

        if (resolveInitialPromise && this.currentState) {
          resolveInitialPromise(this.currentState);
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleIncomingMessage(msg);
          if (resolveInitialPromise && msg.type === 'STATE_UPDATE' && msg.payload) {
            resolveInitialPromise(msg.payload);
          }
        } catch {
          // Ignore malformed frame
        }
      };

      this.socket.onerror = () => {
        if (resolveInitialPromise && !this.currentState) {
          resolveInitialPromise(null);
        }
      };

      this.socket.onclose = (ev) => {
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }

        // Non-retryable close codes: 4003 (kicked/banned), 4004 (room missing), 1008 (policy/auth)
        if (!this.shouldReconnect || ev.code === 4003 || ev.code === 4004 || ev.code === 1008) {
          this.shouldReconnect = false;
          if (ev.code === 4003) {
            this.notifyError({
              code: 'KICKED',
              message: 'You were removed from the room by the host.',
            });
            this.notifyStatus('ROOM_CLOSED');
          } else if (ev.code === 4004) {
            this.notifyStatus('ROOM_NOT_FOUND');
          } else {
            this.notifyStatus('DISCONNECTED');
          }
          if (resolveInitialPromise) {
            resolveInitialPromise(null);
          }
          return;
        }

        this.notifyStatus('RECONNECTING');
        this.reconnectTimeout = setTimeout(() => {
          if (this.roomId && this.currentParticipant && this.shouldReconnect) {
            this.initWebSocket();
          }
        }, 3000);
      };
    } catch {
      this.notifyStatus('DISCONNECTED');
      if (resolveInitialPromise) {
        resolveInitialPromise(this.currentState);
      }
    }
  }

  private handleIncomingMessage(msg: SocketMessage) {
    if (!msg || msg.roomId !== this.roomId) return;

    if (msg.type === 'ERROR' && msg.payload) {
      const code = String(msg.payload.code || 'ROOM_ERROR');
      const message = String(msg.payload.message || 'Room error occurred.');
      this.notifyError({ code, message });
      if (code === 'KICKED') {
        this.shouldReconnect = false;
        this.notifyStatus('ROOM_CLOSED');
      }
      return;
    }

    if (msg.type === 'STATE_UPDATE' && msg.payload) {
      const incomingState = msg.payload as SharedRoomState;
      if (this.currentState && incomingState.version < this.currentState.version) {
        return;
      }

      this.currentState = incomingState;
      this.notifyState(incomingState);

      if (incomingState.lastAction) {
        this.notifyActivity({
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userName: incomingState.lastAction.userName,
          actionText: incomingState.lastAction.description,
          timestamp: incomingState.lastAction.timestamp,
        });
      }
    } else if (msg.type === 'ACTION' && msg.payload) {
      const action = msg.payload as RoomActionPayload;
      this.notifyActivity({
        id: action.actionId,
        userName: action.userName,
        actionText: this.formatActionDescription(action),
        timestamp: action.timestamp,
      });
    } else if (msg.type === 'CHAT_MESSAGE' && msg.payload) {
      this.notifyChatMessage(msg.payload as RoomChatMessage);
    } else if (msg.type === 'PARTICIPANTS' && Array.isArray(msg.payload)) {
      const myId = this.currentParticipant?.id;
      const normalized = msg.payload.map((p: RoomParticipant) => ({
        ...p,
        isSelf: p.id === myId,
      }));
      this.participants.clear();
      normalized.forEach((p) => this.participants.set(p.id, p));
      this.notifyParticipants(normalized);
    } else if (msg.type === 'JOIN' && msg.payload?.participant && this.wsFallbackActive) {
      const p = msg.payload.participant as RoomParticipant;
      if (p.id !== this.currentParticipant?.id) {
        this.participants.set(p.id, p);
        this.notifyParticipants(Array.from(this.participants.values()));
        this.notifyActivity({
          id: `join-${Date.now()}`,
          userName: p.name,
          actionText: 'joined the room',
          timestamp: Date.now(),
        });
      }
    } else if (msg.type === 'SYNC_REQUEST' && this.wsFallbackActive) {
      const isOwner =
        this.currentParticipant &&
        this.currentState &&
        this.currentState.ownerId === this.currentParticipant.id;
      if (isOwner && this.currentState) {
        const liveState = this.getAuthoritativeHostState();
        if (liveState) {
          this.broadcastLocally({
            type: 'STATE_UPDATE',
            roomId: this.roomId!,
            senderId: this.currentParticipant!.id,
            payload: liveState,
          });
        }
      }
    }
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.roomId = null;
    this.currentParticipant = null;
    this.currentState = null;
    this.sessionToken = null;
    this.participants.clear();
    this.notifyStatus('DISCONNECTED');
  }

  public async sendAction(action: RoomActionPayload): Promise<boolean> {
    if (!this.roomId || !this.currentParticipant) return false;
    const msg: SocketMessage = {
      type: 'ACTION',
      roomId: this.roomId,
      senderId: this.currentParticipant.id,
      payload: action,
    };

    return this.sendTransportMessage(msg);
  }

  public async updateRoomState(state: SharedRoomState): Promise<boolean> {
    if (!this.roomId || !this.currentParticipant) return false;

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

    const msg: SocketMessage = {
      type: 'STATE_UPDATE',
      roomId: this.roomId,
      senderId: this.currentParticipant.id,
      payload: updatedState,
    };

    return this.sendTransportMessage(msg);
  }

  public async kickParticipant(targetUserId: string): Promise<boolean> {
    if (!this.roomId || !this.currentParticipant || !targetUserId) return false;
    const msg: SocketMessage = {
      type: 'MODERATE_KICK',
      roomId: this.roomId,
      senderId: this.currentParticipant.id,
      payload: { targetUserId },
    };
    return this.sendTransportMessage(msg);
  }

  private sendTransportMessage(msg: SocketMessage): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(msg));
        return true;
      } catch {
        return false;
      }
    }
    if (this.wsFallbackActive && this.broadcastChannel) {
      this.broadcastLocally(msg);
      return true;
    }
    return false;
  }

  private broadcastLocally(msg: SocketMessage) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch {
        // Ignore BroadcastChannel error
      }
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

  public onError(listener: (error: RoomErrorPayload) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  public async sendChatMessage(message: RoomChatMessage): Promise<boolean> {
    if (!this.roomId || !this.currentParticipant) return false;
    const socketMsg: SocketMessage = {
      type: 'CHAT_MESSAGE',
      roomId: this.roomId,
      senderId: this.currentParticipant.id,
      payload: message,
    };
    return this.sendTransportMessage(socketMsg);
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
