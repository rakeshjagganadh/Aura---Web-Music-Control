import crypto from 'crypto';
import { Router, Request, Response, json as expressJson } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';

// Ephemeral CSPRNG fallback when ROOM_TOKEN_SECRET is unset (never a hardcoded static secret).
// Tokens issued under the ephemeral secret remain valid for the lifetime of this server process.
const PROCESS_EPHEMERAL_SECRET = crypto.randomBytes(32).toString('hex');

function getTokenSecret(): string {
  const envSecret = process.env.ROOM_TOKEN_SECRET?.trim();
  return envSecret && envSecret.length >= 16 ? envSecret : PROCESS_EPHEMERAL_SECRET;
}

const ROOM_ID_REGEX = /^[a-z0-9_-]{3,32}$/;
const MAX_PAYLOAD_BYTES = 64 * 1024;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

interface RoomTokenPayload {
  sub: string;
  name: string;
  roomId: string;
  role: 'host' | 'guest';
  iat: number;
  exp: number;
}

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  userName: string;
  roomId: string;
  joinedAt: number;
  isOwner: boolean;
  msgTimestamps: number[];
  chatTimestamps: number[];
}

interface ServerRoom {
  roomId: string;
  ownerId: string;
  ownerName: string;
  state: any;
  clients: Map<string, ConnectedClient>;
  bannedUserIds: Set<string>;
}

const rooms = new Map<string, ServerRoom>();

function signPayload(payload: RoomTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getTokenSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token: string): RoomTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', getTokenSecret()).update(body).digest('base64url');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as RoomTokenPayload;
    if (
      !parsed ||
      typeof parsed.sub !== 'string' ||
      typeof parsed.name !== 'string' ||
      typeof parsed.roomId !== 'string' ||
      typeof parsed.exp !== 'number' ||
      Date.now() > parsed.exp
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isOriginAllowed(origin: string | undefined, host: string | undefined): boolean {
  const configured = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    if (!origin) return false;
    return configured.includes(origin);
  }

  // When ALLOWED_ORIGINS is unset, enforce same-host origin when Origin header is present
  if (!origin) return true;
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function sanitizeDisplayName(raw: unknown): string {
  if (typeof raw !== 'string') return 'Listener';
  const cleaned = raw.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 40);
  return cleaned || 'Listener';
}

function isValidHttpUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return true;
  if (url.length > 1000) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeTrack(raw: any): any | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.id !== 'string' || !raw.id.trim() || raw.id.length > 128) return null;
  if (typeof raw.title !== 'string' || !raw.title.trim()) return null;
  if (!isValidHttpUrl(raw.sourceUrl) || !isValidHttpUrl(raw.externalStreamUrl) || !isValidHttpUrl(raw.coverUrl)) {
    return null;
  }

  const allowedSources = new Set([
    'youtube',
    'audius',
    'curated_stream',
    'web_stream',
    'local',
    'radio',
    'jamendo',
    'radiobrowser',
  ]);
  const source = allowedSources.has(raw.source) ? raw.source : 'web_stream';

  return {
    id: raw.id.slice(0, 128),
    title: String(raw.title).slice(0, 200),
    artist: String(raw.artist || 'Unknown Artist').slice(0, 160),
    album: String(raw.album || '').slice(0, 160),
    duration: typeof raw.duration === 'number' && Number.isFinite(raw.duration) ? Math.max(0, raw.duration) : 0,
    source,
    sourceId: typeof raw.sourceId === 'string' ? raw.sourceId.slice(0, 128) : undefined,
    sourceUrl: typeof raw.sourceUrl === 'string' ? raw.sourceUrl : undefined,
    externalStreamUrl: typeof raw.externalStreamUrl === 'string' ? raw.externalStreamUrl : undefined,
    coverUrl: typeof raw.coverUrl === 'string' ? raw.coverUrl : undefined,
    coverColor: typeof raw.coverColor === 'string' ? raw.coverColor.slice(0, 80) : undefined,
  };
}

function checkRateLimit(bucket: number[], windowMs: number, maxCount: number): boolean {
  const now = Date.now();
  while (bucket.length > 0 && now - bucket[0] > windowMs) {
    bucket.shift();
  }
  if (bucket.length >= maxCount) {
    return false;
  }
  bucket.push(now);
  return true;
}

function getLiveElapsedPosition(state: any): number {
  if (!state) return 0;
  let pos = Number(state.position) || 0;
  if (state.isPlaying && typeof state.updatedAt === 'number') {
    const elapsedSec = Math.max(0, (Date.now() - state.updatedAt) / 1000) * (Number(state.playbackRate) || 1);
    const maxDur = Number(state.currentTrack?.duration) || 999999;
    pos = Math.min(maxDur, pos + elapsedSec);
  }
  return Math.max(0, pos);
}

function applyServerAction(room: ServerRoom, client: ConnectedClient, action: any): { ok: boolean; error?: string } {
  const type = typeof action?.type === 'string' ? action.type : '';
  const now = Date.now();
  const isOwner = client.userId === room.ownerId;

  const hostOnlyTypes = new Set(['SEEK', 'REMOVE_TRACK', 'REORDER_QUEUE']);
  if (hostOnlyTypes.has(type) && !isOwner) {
    return { ok: false, error: 'Only the room host can perform this action.' };
  }

  if (!room.state) {
    return { ok: false, error: 'Room state is not initialized yet.' };
  }

  const nextState = {
    ...room.state,
    version: (Number(room.state.version) || 0) + 1,
    updatedAt: now,
  };

  if (room.state.isPlaying && room.state.currentTrack) {
    nextState.position = getLiveElapsedPosition(room.state);
  }

  switch (type) {
    case 'PLAY':
      nextState.isPlaying = true;
      nextState.lastAction = {
        type: 'PLAY',
        userId: client.userId,
        userName: client.userName,
        description: 'resumed playback',
        timestamp: now,
      };
      break;
    case 'PAUSE':
      nextState.isPlaying = false;
      nextState.lastAction = {
        type: 'PAUSE',
        userId: client.userId,
        userName: client.userName,
        description: 'paused playback',
        timestamp: now,
      };
      break;
    case 'SEEK': {
      const targetPos = Number(action?.data?.position);
      if (!Number.isFinite(targetPos) || targetPos < 0) {
        return { ok: false, error: 'Invalid seek position.' };
      }
      nextState.position = targetPos;
      nextState.lastAction = {
        type: 'SEEK',
        userId: client.userId,
        userName: client.userName,
        description: `seeked to ${Math.floor(targetPos)}s`,
        timestamp: now,
      };
      break;
    }
    case 'NEXT': {
      const queue: any[] = Array.isArray(nextState.queue) ? nextState.queue : [];
      if (queue.length === 0) return { ok: false, error: 'Queue is empty.' };
      const curIdx = nextState.currentTrack ? queue.findIndex((t) => t.id === nextState.currentTrack.id) : -1;
      const nextTrack = queue[(curIdx + 1) % queue.length];
      nextState.currentTrack = nextTrack;
      nextState.position = 0;
      nextState.isPlaying = true;
      nextState.lastAction = {
        type: 'NEXT',
        userId: client.userId,
        userName: client.userName,
        description: `skipped to "${nextTrack.title}"`,
        timestamp: now,
      };
      break;
    }
    case 'PREVIOUS': {
      const queue: any[] = Array.isArray(nextState.queue) ? nextState.queue : [];
      if (queue.length === 0) return { ok: false, error: 'Queue is empty.' };
      const curIdx = nextState.currentTrack ? queue.findIndex((t) => t.id === nextState.currentTrack.id) : -1;
      const prevIdx = curIdx > 0 ? curIdx - 1 : queue.length - 1;
      const prevTrack = queue[prevIdx];
      nextState.currentTrack = prevTrack;
      nextState.position = 0;
      nextState.isPlaying = true;
      nextState.lastAction = {
        type: 'PREVIOUS',
        userId: client.userId,
        userName: client.userName,
        description: `switched back to "${prevTrack.title}"`,
        timestamp: now,
      };
      break;
    }
    case 'CHANGE_TRACK': {
      const sanitized = sanitizeTrack(action?.data?.track);
      if (!sanitized) return { ok: false, error: 'Invalid track payload.' };
      const queue: any[] = Array.isArray(nextState.queue) ? [...nextState.queue] : [];
      if (!queue.some((t) => t.id === sanitized.id) && queue.length < 200) {
        queue.push(sanitized);
      }
      nextState.currentTrack = sanitized;
      nextState.queue = queue;
      nextState.position = 0;
      nextState.isPlaying = true;
      nextState.lastAction = {
        type: 'CHANGE_TRACK',
        userId: client.userId,
        userName: client.userName,
        description: `played "${sanitized.title}"`,
        timestamp: now,
      };
      break;
    }
    case 'ADD_TRACK': {
      const sanitized = sanitizeTrack(action?.data?.track);
      if (!sanitized) return { ok: false, error: 'Invalid track payload.' };
      const queue: any[] = Array.isArray(nextState.queue) ? [...nextState.queue] : [];
      if (queue.length >= 200) return { ok: false, error: 'Room queue limit reached (200 tracks).' };
      if (!queue.some((t) => t.id === sanitized.id)) {
        queue.push(sanitized);
      }
      if (!nextState.currentTrack) {
        nextState.currentTrack = sanitized;
        nextState.position = 0;
        nextState.isPlaying = true;
      }
      nextState.queue = queue;
      nextState.lastAction = {
        type: 'ADD_TRACK',
        userId: client.userId,
        userName: client.userName,
        description: `added "${sanitized.title}" to queue`,
        timestamp: now,
      };
      break;
    }
    case 'REMOVE_TRACK': {
      const idToRemove = typeof action?.data?.trackId === 'string' ? action.data.trackId : '';
      if (!idToRemove) return { ok: false, error: 'Missing trackId.' };
      const queue: any[] = Array.isArray(nextState.queue) ? nextState.queue.filter((t: any) => t.id !== idToRemove) : [];
      nextState.queue = queue;
      if (nextState.currentTrack?.id === idToRemove) {
        nextState.currentTrack = queue[0] || null;
        nextState.position = 0;
      }
      nextState.lastAction = {
        type: 'REMOVE_TRACK',
        userId: client.userId,
        userName: client.userName,
        description: 'removed a track from queue',
        timestamp: now,
      };
      break;
    }
    case 'REORDER_QUEUE': {
      if (!Array.isArray(action?.data?.queue) || action.data.queue.length > 200) {
        return { ok: false, error: 'Invalid queue payload.' };
      }
      const sanitizedQueue = action.data.queue.map(sanitizeTrack).filter(Boolean);
      nextState.queue = sanitizedQueue;
      nextState.lastAction = {
        type: 'REORDER_QUEUE',
        userId: client.userId,
        userName: client.userName,
        description: 'reordered the queue',
        timestamp: now,
      };
      break;
    }
    default:
      return { ok: false, error: 'Unsupported action type.' };
  }

  room.state = nextState;
  return { ok: true };
}

export const roomAuthRouter = Router();
roomAuthRouter.use(expressJson({ limit: '16kb' }));

/**
 * POST /api/room-auth/token
 * Issues an HMAC-SHA256 signed session/host token for Listen Together WebSocket connections.
 * Never trusts client-chosen userId or host flags; identity Continuity across reconnects
 * is only preserved when presenting a previously signed valid session token.
 */
roomAuthRouter.post('/token', (req: Request, res: Response) => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
  if (!isOriginAllowed(origin, host)) {
    res.status(403).json({ error: 'Origin not allowed.' });
    return;
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  const rawRoomId = typeof req.body?.roomId === 'string' ? req.body.roomId.trim().toLowerCase() : '';
  const mode = req.body?.mode === 'create' ? 'create' : 'join';
  const displayName = sanitizeDisplayName(req.body?.displayName);
  const previousToken = typeof req.body?.previousToken === 'string' ? req.body.previousToken : '';

  if (!ROOM_ID_REGEX.test(rawRoomId)) {
    res.status(400).json({ error: 'Invalid room code format.' });
    return;
  }

  // Preserve verified subject ID only if caller presents a valid server-signed token
  const prior = previousToken ? verifyToken(previousToken) : null;
  const userId = prior?.sub || `usr_${crypto.randomUUID()}`;

  const existingRoom = rooms.get(rawRoomId);
  if (mode === 'create' && existingRoom && existingRoom.ownerId !== userId) {
    res.status(409).json({ error: 'Room code already active with another host.' });
    return;
  }

  if (existingRoom && existingRoom.bannedUserIds.has(userId)) {
    res.status(403).json({ error: 'You have been removed from this room by the host.' });
    return;
  }

  const role: 'host' | 'guest' =
    (existingRoom && existingRoom.ownerId === userId) || (!existingRoom && mode === 'create')
      ? 'host'
      : 'guest';

  if (mode === 'create' && !existingRoom) {
    rooms.set(rawRoomId, {
      roomId: rawRoomId,
      ownerId: userId,
      ownerName: displayName,
      state: null,
      clients: new Map(),
      bannedUserIds: new Set(),
    });
  }

  const now = Date.now();
  const payload: RoomTokenPayload = {
    sub: userId,
    name: displayName,
    roomId: rawRoomId,
    role,
    iat: now,
    exp: now + TOKEN_TTL_MS,
  };

  const token = signPayload(payload);
  res.json({
    token,
    userId,
    userName: displayName,
    roomId: rawRoomId,
    role,
    expiresAt: payload.exp,
  });
});

export function attachRoomWebSocketServer(httpServer: any) {
  if (!httpServer) return;

  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_PAYLOAD_BYTES,
  });

  httpServer.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
    const hostHeader = typeof request.headers.host === 'string' ? request.headers.host : 'localhost';
    const url = new URL(request.url || '', `http://${hostHeader}`);

    if (url.pathname !== '/api/room-ws') {
      return;
    }

    const origin = typeof request.headers.origin === 'string' ? request.headers.origin : undefined;
    if (!isOriginAllowed(origin, hostHeader)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    const roomId = (url.searchParams.get('room') || '').trim().toLowerCase();
    const token = url.searchParams.get('token') || '';
    const claims = verifyToken(token);

    if (!ROOM_ID_REGEX.test(roomId) || !claims || claims.roomId !== roomId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const room = rooms.get(roomId);
    if (room && room.bannedUserIds.has(claims.sub)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, claims);
    });
  });

  wss.on('connection', (ws: WebSocket, _request: IncomingMessage, claims?: RoomTokenPayload) => {
    if (!claims) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    const roomId = claims.roomId;
    const userId = claims.sub;
    const userName = claims.name;

    let room = rooms.get(roomId);
    if (!room) {
      // Only allow creating a fresh server room record with a verified host token
      if (claims.role !== 'host') {
        ws.close(4004, 'Room not found');
        return;
      }
      room = {
        roomId,
        ownerId: userId,
        ownerName: userName,
        state: null,
        clients: new Map(),
        bannedUserIds: new Set(),
      };
      rooms.set(roomId, room);
    }

    if (room.bannedUserIds.has(userId)) {
      ws.close(4003, 'Removed by host');
      return;
    }

    const isOwner = room.ownerId === userId;
    const client: ConnectedClient = {
      ws,
      userId,
      userName,
      roomId,
      joinedAt: Date.now(),
      isOwner,
      msgTimestamps: [],
      chatTimestamps: [],
    };

    room.clients.set(userId, client);

    if (room.state) {
      const livePos = getLiveElapsedPosition(room.state);
      room.state = {
        ...room.state,
        position: livePos,
        updatedAt: Date.now(),
      };
      ws.send(
        JSON.stringify({
          type: 'STATE_UPDATE',
          roomId,
          senderId: 'server',
          payload: room.state,
        })
      );
    }

    broadcastParticipants(room);

    ws.on('message', (data) => {
      if (!checkRateLimit(client.msgTimestamps, 5000, 25)) {
        ws.send(
          JSON.stringify({
            type: 'ERROR',
            roomId,
            senderId: 'server',
            payload: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' },
          })
        );
        return;
      }

      try {
        const rawStr = data.toString();
        if (rawStr.length > MAX_PAYLOAD_BYTES) return;
        const msg = JSON.parse(rawStr);
        if (!msg || typeof msg !== 'object' || msg.roomId !== roomId) return;

        if (msg.type === 'STATE_UPDATE' && msg.payload) {
          // STRICT HOST AUTHORIZATION: only verified owner can replace raw room state
          if (client.userId !== room!.ownerId) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                roomId,
                senderId: 'server',
                payload: { code: 'FORBIDDEN', message: 'Only the room host can overwrite room state.' },
              })
            );
            return;
          }
          const incomingState = msg.payload;
          const sanitizedQueue = Array.isArray(incomingState.queue)
            ? incomingState.queue.slice(0, 200).map(sanitizeTrack).filter(Boolean)
            : [];
          const sanitizedCurrent = incomingState.currentTrack ? sanitizeTrack(incomingState.currentTrack) : null;
          const nextVersion = Math.max((room!.state?.version || 0) + 1, Number(incomingState.version) || 1);

          room!.state = {
            ...incomingState,
            roomId,
            roomName: String(incomingState.roomName || 'AURA Room').slice(0, 80),
            ownerId: room!.ownerId, // Authoritative server ownerId
            ownerName: room!.ownerName,
            currentTrack: sanitizedCurrent,
            queue: sanitizedQueue,
            version: nextVersion,
            updatedAt: Date.now(),
          };
          broadcastToRoom(room!, { type: 'STATE_UPDATE', roomId, senderId: 'server', payload: room!.state }, userId);
        } else if (msg.type === 'ACTION' && msg.payload) {
          const result = applyServerAction(room!, client, msg.payload);
          if (!result.ok) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                roomId,
                senderId: 'server',
                payload: { code: 'ACTION_REJECTED', message: result.error },
              })
            );
            return;
          }
          // Broadcast authoritative reduced state & action notification to ALL room participants
          broadcastToRoom(room!, {
            type: 'STATE_UPDATE',
            roomId,
            senderId: 'server',
            payload: room!.state,
          });
        } else if (msg.type === 'CHAT_MESSAGE' && msg.payload) {
          if (!checkRateLimit(client.chatTimestamps, 5000, 6)) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                roomId,
                senderId: 'server',
                payload: { code: 'RATE_LIMITED', message: 'Chat rate limit reached.' },
              })
            );
            return;
          }
          const rawText = typeof msg.payload.text === 'string' ? msg.payload.text.trim().slice(0, 500) : '';
          if (!rawText) return;
          const verifiedChat = {
            id: `msg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
            roomId,
            senderId: client.userId,
            senderName: client.userName,
            text: rawText,
            timestamp: Date.now(),
            isHost: client.userId === room!.ownerId,
          };
          broadcastToRoom(room!, { type: 'CHAT_MESSAGE', roomId, senderId: client.userId, payload: verifiedChat }, client.userId);
        } else if (msg.type === 'MODERATE_KICK' && msg.payload) {
          if (client.userId !== room!.ownerId) {
            ws.send(
              JSON.stringify({
                type: 'ERROR',
                roomId,
                senderId: 'server',
                payload: { code: 'FORBIDDEN', message: 'Only the host can moderate participants.' },
              })
            );
            return;
          }
          const targetId = typeof msg.payload.targetUserId === 'string' ? msg.payload.targetUserId : '';
          if (!targetId || targetId === room!.ownerId) return;
          room!.bannedUserIds.add(targetId);
          const targetClient = room!.clients.get(targetId);
          if (targetClient) {
            try {
              targetClient.ws.send(
                JSON.stringify({
                  type: 'ERROR',
                  roomId,
                  senderId: 'server',
                  payload: { code: 'KICKED', message: 'You were removed from the room by the host.' },
                })
              );
              targetClient.ws.close(4003, 'Removed by host');
            } catch {
              // ignore
            }
            room!.clients.delete(targetId);
          }
          broadcastParticipants(room!);
        } else if (msg.type === 'JOIN' && msg.payload) {
          if (msg.payload.initialState && !room!.state && client.userId === room!.ownerId) {
            const init = msg.payload.initialState;
            room!.state = {
              ...init,
              roomId,
              roomName: String(init.roomName || 'AURA Room').slice(0, 80),
              ownerId: room!.ownerId,
              ownerName: room!.ownerName,
              currentTrack: init.currentTrack ? sanitizeTrack(init.currentTrack) : null,
              queue: Array.isArray(init.queue) ? init.queue.slice(0, 200).map(sanitizeTrack).filter(Boolean) : [],
              version: 1,
              updatedAt: Date.now(),
            };
          }
          if (room!.state && ws.readyState === WebSocket.OPEN) {
            const livePos = getLiveElapsedPosition(room!.state);
            room!.state = {
              ...room!.state,
              position: livePos,
              updatedAt: Date.now(),
            };
            ws.send(
              JSON.stringify({
                type: 'STATE_UPDATE',
                roomId,
                senderId: 'server',
                payload: room!.state,
              })
            );
          }
          broadcastParticipants(room!);
        } else if (msg.type === 'SYNC_REQUEST') {
          if (room!.state && ws.readyState === WebSocket.OPEN) {
            const livePos = getLiveElapsedPosition(room!.state);
            room!.state = {
              ...room!.state,
              position: livePos,
              updatedAt: Date.now(),
            };
            ws.send(
              JSON.stringify({
                type: 'STATE_UPDATE',
                roomId,
                senderId: 'server',
                payload: room!.state,
              })
            );
          }
        } else if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', roomId, timestamp: Date.now() }));
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      room?.clients.delete(userId);
      if (room) {
        broadcastParticipants(room);
        if (room.clients.size === 0) {
          setTimeout(() => {
            if (room && room.clients.size === 0) {
              rooms.delete(roomId);
            }
          }, 3600000);
        }
      }
    });

    ws.on('error', (err) => {
      console.warn(`WebSocket error for user ${userId} in room ${roomId}:`, err);
    });
  });

  return wss;
}

function broadcastToRoom(room: ServerRoom, msg: any, excludeUserId?: string) {
  const json = JSON.stringify(msg);
  room.clients.forEach((client, id) => {
    if (id !== excludeUserId && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(json);
      } catch (e) {
        console.warn(`Failed to send to client ${id}:`, e);
      }
    }
  });
}

function broadcastParticipants(room: ServerRoom) {
  const participants = Array.from(room.clients.values()).map((c) => ({
    id: c.userId,
    name: c.userName,
    joinedAt: c.joinedAt,
    isOwner: room.ownerId === c.userId,
  }));

  const msg = {
    type: 'PARTICIPANTS',
    roomId: room.roomId,
    senderId: 'server',
    payload: participants,
  };

  const json = JSON.stringify(msg);
  room.clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(json);
      } catch (e) {
        console.warn(`Failed to send participants to client ${client.userId}:`, e);
      }
    }
  });
}
