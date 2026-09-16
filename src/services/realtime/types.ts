import { Track } from '../../types';

export type RoomActionType =
  | 'PLAY'
  | 'PAUSE'
  | 'NEXT'
  | 'PREVIOUS'
  | 'SEEK'
  | 'ADD_TRACK'
  | 'REMOVE_TRACK'
  | 'REORDER_QUEUE'
  | 'CHANGE_TRACK'
  | 'SYNC_CHECKPOINT';

export interface SharedRoomTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  source: 'youtube' | 'audius' | 'curated_stream' | 'web_stream' | 'local' | 'radio';
  sourceId?: string;
  sourceUrl?: string;
  externalStreamUrl?: string;
  coverUrl?: string;
  coverColor?: string;
}

export interface RoomParticipant {
  id: string;
  name: string;
  joinedAt: number;
  isOwner?: boolean;
  isSelf?: boolean;
}

export interface RoomActionPayload {
  actionId: string;
  type: RoomActionType;
  userId: string;
  userName: string;
  timestamp: number;
  data?: {
    position?: number;
    track?: SharedRoomTrack;
    trackId?: string;
    queue?: SharedRoomTrack[];
    trackIndex?: number;
    reason?: string;
  };
}

export interface SharedRoomState {
  roomId: string;
  roomName: string;
  ownerId: string;
  ownerName: string;
  currentTrack: SharedRoomTrack | null;
  queue: SharedRoomTrack[];
  isPlaying: boolean;
  position: number; // in seconds at updatedAt
  playbackRate: number;
  updatedAt: number; // ms timestamp
  version: number; // monotonic state sequence
  lastAction?: {
    type: RoomActionType;
    userName: string;
    userId: string;
    description: string;
    timestamp: number;
  };
}

export interface RoomActivityItem {
  id: string;
  userName: string;
  actionText: string;
  timestamp: number;
}

export type RoomConnectionStatus =
  | 'CREATING'
  | 'JOINING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'DISCONNECTED'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_CLOSED'
  | 'PLAYBACK_ERROR';

export type RealtimeBackendType = 'supabase' | 'websocket' | 'broadcast';

export type LivePlaybackPositionProvider = () => {
  position: number;
  isPlaying: boolean;
  playbackRate?: number;
  trackId?: string | null;
  source?: string;
} | null;

export interface IRoomRealtimeAdapter {
  backendType: RealtimeBackendType;
  connect(
    roomId: string,
    participant: RoomParticipant,
    initialState?: SharedRoomState
  ): Promise<SharedRoomState | null>;
  disconnect(): void;
  sendAction(action: RoomActionPayload): Promise<boolean>;
  updateRoomState(state: SharedRoomState): Promise<boolean>;
  onStateUpdate(listener: (state: SharedRoomState) => void): () => void;
  onParticipantsUpdate(listener: (participants: RoomParticipant[]) => void): () => void;
  onActivity(listener: (activity: RoomActivityItem) => void): () => void;
  onStatusChange(listener: (status: RoomConnectionStatus) => void): () => void;
  setLivePositionProvider?(provider: LivePlaybackPositionProvider | null): void;
}

// Helper to convert Track to SharedRoomTrack
export function trackToSharedTrack(track: Track): SharedRoomTrack {
  let streamUrl = track.externalStreamUrl || track.audioUrl || '';
  if (track.source === 'audius' && !streamUrl) {
    const cleanId = String(track.sourceId || track.id).replace(/^audius-/, '');
    streamUrl = `https://api.audius.co/v1/tracks/${cleanId}/stream?app_name=AURA_STUDIO`;
  }

  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album || '',
    duration: track.duration || 0,
    source: track.source || 'local',
    sourceId: track.sourceId ? String(track.sourceId).replace(/^audius-/, '') : undefined,
    sourceUrl: track.sourceUrl,
    externalStreamUrl: streamUrl,
    coverUrl: track.coverUrl,
    coverColor: track.coverColor,
  };
}

// Helper to convert SharedRoomTrack back to Track for AURA player
export function sharedTrackToTrack(shared: SharedRoomTrack): Track {
  let streamUrl = shared.externalStreamUrl || '';
  const cleanSourceId = shared.sourceId ? String(shared.sourceId).replace(/^audius-/, '') : String(shared.id).replace(/^audius-/, '');

  if (shared.source === 'audius') {
    if (!streamUrl || !streamUrl.includes('/stream')) {
      streamUrl = `https://api.audius.co/v1/tracks/${cleanSourceId}/stream?app_name=AURA_STUDIO`;
    }
  }

  return {
    id: shared.id,
    title: shared.title,
    artist: shared.artist,
    album: shared.album || '',
    duration: shared.duration,
    fileFormat: shared.source === 'youtube' ? 'YOUTUBE' : shared.source === 'audius' ? 'AUDIUS' : 'STREAM',
    fileSize: 0,
    dateAdded: Date.now(),
    coverUrl: shared.coverUrl,
    coverColor: shared.coverColor,
    source: shared.source,
    sourceId: cleanSourceId,
    sourceUrl: shared.sourceUrl || (shared.source === 'audius' ? `https://audius.co/tracks/${cleanSourceId}` : undefined),
    externalStreamUrl: streamUrl,
    audioUrl: streamUrl,
    isAvailable: true,
  };
}
