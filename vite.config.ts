import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { attachRoomWebSocketServer } from './src/server/roomWsServer';

function roomWebSocketVitePlugin() {
  return {
    name: 'aura-room-ws-plugin',
    configureServer(server: any) {
      if (server.httpServer) {
        attachRoomWebSocketServer(server.httpServer);
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), roomWebSocketVitePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
