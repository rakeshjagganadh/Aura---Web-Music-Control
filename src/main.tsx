import { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import App from './App.tsx';
import './index.css';
import { initMaterialSymbolsMonitor } from './icons/fontStatus';

initMaterialSymbolsMonitor();

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected rendering error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AURA] Uncaught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#11131b] p-6 text-center space-y-4">
            <h1 className="text-lg font-semibold text-white">AURA failed to render</h1>
            <p className="text-xs text-zinc-400 break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-semibold cursor-pointer"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Register PWA Service Worker ONLY in production outside dev/AI Studio preview tunnels;
// in dev/preview, proactively purge stale SW registrations and caches that can serve mismatched Vite modules.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const host = window.location.hostname;
  const isDevOrPreviewHost =
    !import.meta.env.PROD ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.startsWith('ais-dev-');

  window.addEventListener('load', () => {
    if (isDevOrPreviewHost) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
      if ('caches' in window) {
        caches
          .keys()
          .then((names) =>
            Promise.all(names.filter((n) => n.startsWith('aura-')).map((n) => caches.delete(n)))
          )
          .catch(() => {});
      }
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (reg.installing) {
          console.log('[AURA PWA] Service worker installing');
        } else if (reg.waiting) {
          console.log('[AURA PWA] Service worker installed & waiting');
        } else if (reg.active) {
          console.log('[AURA PWA] Service worker active');
        }
      })
      .catch((err) => {
        console.warn('[AURA PWA] Service worker registration note:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);

