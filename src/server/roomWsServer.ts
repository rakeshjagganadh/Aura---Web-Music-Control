import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  userName: string;
  roomId: string;
  joinedAt: number;
}

interface ServerRoom {
  roomId: string;
  state: any;
  clients: Map<string, ConnectedClient>;
}

const rooms = new Map<string, ServerRoom>();

export function attachRoomWebSocketServer(httpServer: any) {
  if (!httpServer) return;

  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);

    if (url.pathname === '/api/room-ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    const roomId = url.searchParams.get('room');
    const userId = url.searchParams.get('user') || `user_${Date.now()}`;
    const userName = decodeURIComponent(url.searchParams.get('name') || 'Listener');

    if (!roomId) {
      ws.close(1008, 'Missing roomId');
      return;
    }

    let room = rooms.get(roomId);
    if (!room) {
      room = {
        roomId,
        state: null,
        clients: new Map(),
      };
      rooms.set(roomId, room);
    }

    const client: ConnectedClient = {
      ws,
      userId,
      userName,
      roomId,
      joinedAt: Date.now(),
    };

    room.clients.set(userId, client);

    // Send existing room state to the newly connected participant
    if (room.state) {
      ws.send(
        JSON.stringify({
          type: 'STATE_UPDATE',
          roomId,
          senderId: 'server',
          payload: room.state,
        })
      );
    }

    // Broadcast updated participant list to everyone in the room
    broadcastParticipants(room);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (!msg || msg.roomId !== roomId) return;

        if (msg.type === 'STATE_UPDATE' && msg.payload) {
          const incomingState = msg.payload;
          // Monotonic sequence version protection
          if (!room.state || (incomingState.version && incomingState.version >= (room.state.version || 0))) {
            room.state = incomingState;
            // Broadcast to all other clients in the room
            broadcastToRoom(room, msg, userId);
          }
        } else if (msg.type === 'ACTION' && msg.payload) {
          broadcastToRoom(room, msg, userId);
        } else if (msg.type === 'JOIN' && msg.payload) {
          if (msg.payload.initialState && !room.state) {
            room.state = msg.payload.initialState;
          }
          // If server already has room state, reply back to the newly joined client immediately
          if (room.state && ws.readyState === WebSocket.OPEN) {
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
        } else if (msg.type === 'SYNC_REQUEST') {
          if (room.state && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'STATE_UPDATE',
                roomId,
                senderId: 'server',
                payload: room.state,
              })
            );
          } else {
            // Forward to peers in the room (e.g. host)
            broadcastToRoom(room, msg, userId);
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
          // Clean up room after 1 hour if empty
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
    isOwner: room.state?.ownerId === c.userId,
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
