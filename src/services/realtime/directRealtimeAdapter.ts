import {
  IRoomRealtimeAdapter,
  RealtimeBackendType,
  RoomActionPayload,
  RoomActivityItem,
  RoomConnectionStatus,
  RoomParticipant,
  SharedRoomState,
} from './types';

interface SocketMessage {
  type: 'JOIN' | 'STATE_UPDATE' | 'ACTION' | 'SYNC_REQUEST' | 'PING' | 'PARTICIPANTS';
  roomId: string;
  senderId: string;
  payload?: any;
}

export class DirectRealtimeAdapter implements IRoomRealtimeAdapter {
  public backendType: RealtimeBackendType = 'websocket';

  private socket: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private roomId: string | null = null;
  private currentParticipant: RoomParticipant | null = null;
  private currentState: SharedRoomState | null = null;
  private participants: Map<string, RoomParticipant> = new Map();

  private stateListeners = new Set<(state: SharedRoomState) => void>();
  private participantsListeners = new Set<(participants: RoomParticipant[]) => void>();
  private activityListeners = new Set<(activity: RoomActivityItem) => void>();
  private statusListeners = new Set<(status: RoomConnectionStatus) => void>();

  private pingInterval: any = null;
  private reconnectTimeout: any = null;

  public async connect(
    roomId: string,
    participant: RoomParticipant,
    initialState?: SharedRoomState
  ): Promise<SharedRoomState | null> {
    this.roomId = roomId;
    this.currentParticipant = participant;
    this.notifyStatus('CONNECTING');

    if (initialState) {
      this.currentState = initialState;
    }

    // Always initialize multi-tab BroadcastChannel for zero-latency local tab synchronization
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(`aura-room-${roomId}`);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    // Connect to native WebSocket endpoint on current origin
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

      // Resolve immediately if initial state exists (e.g. Creator)
      if (this.currentState) {
        safeResolve(this.currentState);
        return;
      }

      // Guest: send sync request to peers
      setTimeout(() => {
        if (!resolved) {
          const syncMsg: SocketMessage = {
            type: 'SYNC_REQUEST',
            roomId: this.roomId!,
            senderId: this.currentParticipant!.id,
          };
          this.broadcastLocally(syncMsg);
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(syncMsg));
          }
        }
      }, 300);

      // Timeout after 3.5 seconds: if peers exist or state received, resolve; else null
      setTimeout(() => {
        if (!resolved) {
          if (this.currentState) {
            safeResolve(this.currentState);
          } else if (this.participants.size > 0) {
            const firstPeer = Array.from(this.participants.values())[0];
            const fallback: SharedRoomState = {
              roomId: this.roomId!,
              roomName: `${firstPeer?.name || 'AURA'}'s Room`,
              ownerId: firstPeer?.id || 'host',
              ownerName: firstPeer?.name || 'Host',
              currentTrack: null,
              queue: [],
              isPlaying: false,
              position: 0,
              playbackRate: 1,
              updatedAt: Date.now(),
              version: 1,
            };
            safeResolve(fallback);
          } else {
            safeResolve(null);
          }
        }
      }, 3500);
    });
  }

  private initWebSocket(resolveInitialPromise?: (state: SharedRoomState | null) => void) {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/room-ws?room=${this.roomId}&user=${this.currentParticipant?.id}&name=${encodeURIComponent(this.currentParticipant?.name || 'Listener')}`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.notifyStatus('CONNECTED');
        this.backendType = 'websocket';

        // Send JOIN message
        const joinMsg: SocketMessage = {
          type: 'JOIN',
          roomId: this.roomId!,
          senderId: this.currentParticipant!.id,
          payload: {
            participant: this.currentParticipant,
            initialState: this.currentState,
          },
        };
        this.socket?.send(JSON.stringify(joinMsg));

        // Start ping heartbeat
        this.pingInterval = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'PING', roomId: this.roomId, senderId: this.currentParticipant?.id }));
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
        } catch (err) {
          console.error('Error parsing room message:', err);
        }
      };

      this.socket.onerror = () => {
        // Fallback to broadcast channel if websocket connection is not available
        this.backendType = 'broadcast';
        this.notifyStatus('CONNECTED');
        if (resolveInitialPromise) {
          resolveInitialPromise(this.currentState);
        }
      };

      this.socket.onclose = () => {
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.notifyStatus('RECONNECTING');

        // Schedule reconnection
        this.reconnectTimeout = setTimeout(() => {
          if (this.roomId && this.currentParticipant) {
            this.initWebSocket();
          }
        }, 3000);
      };
    } catch {
      this.backendType = 'broadcast';
      this.notifyStatus('CONNECTED');
      if (resolveInitialPromise) {
        resolveInitialPromise(this.currentState);
      }
    }
  }

  private handleIncomingMessage(msg: SocketMessage) {
    if (!msg || msg.roomId !== this.roomId) return;

    if (msg.type === 'STATE_UPDATE' && msg.payload) {
      const incomingState = msg.payload as SharedRoomState;
      // Version monotonic guard
      if (this.currentState && incomingState.version <= this.currentState.version) {
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
    } else if (msg.type === 'PARTICIPANTS' && Array.isArray(msg.payload)) {
      this.notifyParticipants(msg.payload);
    } else if (msg.type === 'JOIN' && msg.payload?.participant) {
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

        // ONLY the host / room owner should respond with state sync to avoid multi-peer state broadcast collisions
        const isOwner =
          this.currentParticipant &&
          this.currentState &&
          this.currentState.ownerId === this.currentParticipant.id;

        if (isOwner && this.currentState) {
          let liveState = this.currentState;
          if (liveState.isPlaying && liveState.updatedAt) {
            const elapsed = Math.max(0, (Date.now() - liveState.updatedAt) / 1000) * (liveState.playbackRate || 1);
            const maxDur = liveState.currentTrack?.duration || 999999;
            const livePos = Math.min(maxDur, (liveState.position || 0) + elapsed);
            liveState = {
              ...liveState,
              position: livePos,
              updatedAt: Date.now(),
            };
          }

          this.broadcastLocally({
            type: 'STATE_UPDATE',
            roomId: this.roomId!,
            senderId: this.currentParticipant!.id,
            payload: liveState,
          });
        }
      }
    } else if (msg.type === 'SYNC_REQUEST') {
      const isOwner =
        this.currentParticipant &&
        this.currentState &&
        this.currentState.ownerId === this.currentParticipant.id;

      // Only host or standalone peer in BroadcastChannel should reply with live state
      if (this.currentState && (isOwner || !this.socket || this.socket.readyState !== WebSocket.OPEN)) {
        let liveState = this.currentState;
        if (liveState.isPlaying && liveState.updatedAt) {
          const elapsed = Math.max(0, (Date.now() - liveState.updatedAt) / 1000) * (liveState.playbackRate || 1);
          const maxDur = liveState.currentTrack?.duration || 999999;
          const livePos = Math.min(maxDur, (liveState.position || 0) + elapsed);
          liveState = {
            ...liveState,
            position: livePos,
            updatedAt: Date.now(),
          };
        }

        this.broadcastLocally({
          type: 'STATE_UPDATE',
          roomId: this.roomId!,
          senderId: this.currentParticipant!.id,
          payload: liveState,
        });
        if (this.socket?.readyState === WebSocket.OPEN) {
          this.socket.send(
            JSON.stringify({
              type: 'STATE_UPDATE',
              roomId: this.roomId,
              senderId: this.currentParticipant?.id,
              payload: liveState,
            })
          );
        }
      }
    }
  }

  public disconnect(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

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
    this.notifyStatus('DISCONNECTED');
  }

  public async sendAction(action: RoomActionPayload): Promise<boolean> {
    const msg: SocketMessage = {
      type: 'ACTION',
      roomId: this.roomId!,
      senderId: this.currentParticipant!.id,
      payload: action,
    };

    this.broadcastMessage(msg);
    return true;
  }

  public async updateRoomState(state: SharedRoomState): Promise<boolean> {
    if (!this.roomId) return false;

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
      senderId: this.currentParticipant?.id || 'unknown',
      payload: updatedState,
    };

    this.broadcastMessage(msg);
    return true;
  }

  private broadcastMessage(msg: SocketMessage) {
    // 1. Send via WebSocket if open
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(msg));
      } catch (err) {
        console.warn('Failed to send WebSocket message:', err);
      }
    }

    // 2. Broadcast via BroadcastChannel across local tabs
    this.broadcastLocally(msg);
  }

  private broadcastLocally(msg: SocketMessage) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (err) {
        console.warn('Failed to post to BroadcastChannel:', err);
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
