import { useSyncExternalStore } from 'react';

export type MaterialSymbolsStatus = 'loading' | 'ready' | 'fallback';

const FONT_FAMILY_NAME = 'Material Symbols Rounded';
const FONT_TEST_SPEC = `20px "${FONT_FAMILY_NAME}"`;
const FALLBACK_TIMEOUT_MS = 3000;

let currentStatus: MaterialSymbolsStatus = 'loading';
let initialized = false;
const listeners = new Set<() => void>();

function applyDocumentDataset(status: MaterialSymbolsStatus): void {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dataset.auraIcons = status;
  }
}

function setStatus(next: MaterialSymbolsStatus): void {
  if (currentStatus === next) return;
  currentStatus = next;
  applyDocumentDataset(next);
  listeners.forEach((cb) => cb());
}

function checkFontLoaded(): boolean {
  if (typeof document === 'undefined' || !('fonts' in document)) return false;
  try {
    if (document.fonts.check(FONT_TEST_SPEC)) return true;
    for (const face of document.fonts) {
      if (
        face.family.replace(/['"]/g, '') === FONT_FAMILY_NAME &&
        face.status === 'loaded'
      ) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

export function initMaterialSymbolsMonitor(): void {
  if (initialized || typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  initialized = true;

  if (!('fonts' in document)) {
    setStatus('fallback');
    return;
  }

  if (checkFontLoaded()) {
    setStatus('ready');
    return;
  }

  applyDocumentDataset('loading');

  let settled = false;
  const fallbackTimer = window.setTimeout(() => {
    if (!settled && !checkFontLoaded()) {
      settled = true;
      setStatus('fallback');
    }
  }, FALLBACK_TIMEOUT_MS);

  const onFontsAvailable = () => {
    if (checkFontLoaded()) {
      settled = true;
      window.clearTimeout(fallbackTimer);
      setStatus('ready');
    }
  };

  try {
    document.fonts.load(FONT_TEST_SPEC).then(onFontsAvailable).catch(() => {
      // Handled safely by timeout fallback
    });
    document.fonts.ready.then(onFontsAvailable).catch(() => {
      // Handled safely by timeout fallback
    });
    document.fonts.addEventListener?.('loadingdone', onFontsAvailable);
  } catch {
    // Handled safely by timeout fallback
  }
}

function subscribe(listener: () => void): () => void {
  initMaterialSymbolsMonitor();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): MaterialSymbolsStatus {
  initMaterialSymbolsMonitor();
  return currentStatus;
}

function getServerSnapshot(): MaterialSymbolsStatus {
  return 'loading';
}

export function useMaterialSymbolsStatus(): MaterialSymbolsStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
