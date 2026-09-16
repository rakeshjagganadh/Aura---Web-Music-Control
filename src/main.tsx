import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safe Production Service Worker Registration for PWA Compliance
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Successful registration
        if (reg.installing) {
          console.log('[AURA PWA] Service worker installing');
        } else if (reg.waiting) {
          console.log('[AURA PWA] Service worker installed & waiting');
        } else if (reg.active) {
          console.log('[AURA PWA] Service worker active');
        }
      })
      .catch((err) => {
        // Safe degrade without breaking any app feature
        console.warn('[AURA PWA] Service worker registration note:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

