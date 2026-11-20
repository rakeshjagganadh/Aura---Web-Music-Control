import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { attachRoomWebSocketServer, roomAuthRouter } from './src/server/roomWsServer';
import { youtubeRouter } from './src/server/youtubeRouter';

// Load local .env file if present (native Node.js 20+)
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // Ignore .env syntax warnings
  }
}

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
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      })
    );
    app.get('*', (req, res) => {
      if (
        req.path.startsWith('/assets/') ||
        req.path.startsWith('/api/') ||
        req.path.startsWith('/_vercel/') ||
        /\.[a-zA-Z0-9]+$/.test(req.path)
      ) {
        res.status(404).end();
        return;
      }
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
