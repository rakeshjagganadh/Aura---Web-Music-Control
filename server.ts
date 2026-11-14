import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { attachRoomWebSocketServer, roomAuthRouter } from './src/server/roomWsServer';
import { youtubeRouter } from './src/server/youtubeRouter';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Attach WebSocket server for Listen Together shared rooms
  attachRoomWebSocketServer(server);

  // Health check endpoint for Cloud Run and monitoring
  app.get('/api/health', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Listen Together HMAC token authentication
  app.use('/api/room-auth', roomAuthRouter);

  // Official YouTube Data API v3 search proxy
  app.use('/api/yt', youtubeRouter);

  // Determine production mode: when running built bundle (dist/server.cjs), NODE_ENV=production, or when dist/index.html is served
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (!process.argv[1]?.endsWith('server.ts') && fs.existsSync(path.join(process.cwd(), 'dist', 'index.html')));

  // Vite middleware for development mode / Static files for production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
