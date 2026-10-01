/**
 * Background Audio Keep-Alive Service for Mobile Browsers (Chrome / Safari / Firefox)
 * 
 * Prevents mobile browsers from killing audio playback and throttling JS timers / WebSockets
 * when the user minimizes the browser, turns off the screen, or switches to other apps (e.g. WhatsApp).
 */

class BackgroundAudioKeepAlive {
  private audioEl: HTMLAudioElement | null = null;
  private isKeepAliveActive: boolean = false;
  private wakeLockSentinel: any = null;
  private blobUrl: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initElement();
      this.setupVisibilityListeners();
    }
  }

  private getSilentAudioUri(): string {
    if (this.blobUrl) return this.blobUrl;
    if (typeof window === 'undefined') return '';
    try {
      const sampleRate = 8000;
      const numSamples = sampleRate; // 1 second
      const buffer = new ArrayBuffer(44 + numSamples);
      const view = new DataView(buffer);

      const writeStr = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };

      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + numSamples, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate, true);
      view.setUint16(32, 1, true);
      view.setUint16(34, 8, true);
      writeStr(36, 'data');
      view.setUint32(40, numSamples, true);

      new Uint8Array(buffer, 44, numSamples).fill(128);
      const blob = new Blob([buffer], { type: 'audio/wav' });
      this.blobUrl = URL.createObjectURL(blob);
      return this.blobUrl;
    } catch {
      return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    }
  }

  private initElement() {
    if (typeof document === 'undefined') return;

    let el = document.getElementById('aura-background-keepalive') as HTMLAudioElement | null;
    if (!el) {
      el = document.createElement('audio');
      el.id = 'aura-background-keepalive';
      el.src = this.getSilentAudioUri();
      el.loop = true;
      el.preload = 'auto';
      // Volume must not be strictly 0 for mobile OS audio managers to grant background audio priority
      el.volume = 0.001;
      el.muted = false;
      el.setAttribute('playsinline', 'true');
      el.setAttribute('webkit-playsinline', 'true');
      el.style.position = 'fixed';
      el.style.bottom = '0px';
      el.style.right = '0px';
      el.style.width = '1px';
      el.style.height = '1px';
      el.style.opacity = '0.01';
      el.style.pointerEvents = 'none';
      el.setAttribute('aria-hidden', 'true');

      if (document.body) {
        document.body.appendChild(el);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          if (!document.getElementById('aura-background-keepalive') && document.body) {
            document.body.appendChild(el!);
          }
        });
      }
    }
    this.audioEl = el;
  }

  private setupVisibilityListeners() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Re-acquire wake lock if active when returning to foreground
        if (this.isKeepAliveActive) {
          this.requestWakeLock();
        }
      }
      // Note: We deliberately do NOT call audioEl.play() on 'hidden' because native media playback
      // (audioEngine) already holds the valid background audio session. Calling play() on a secondary
      // audio element forces the mobile OS (Chromium / iOS WebKit) to pause the primary audio track.
    });
  }

  private async requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && (navigator as any).wakeLock) {
      try {
        if (!this.wakeLockSentinel) {
          this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          this.wakeLockSentinel.addEventListener('release', () => {
            this.wakeLockSentinel = null;
          });
        }
      } catch {
        // WakeLock may be rejected on low battery or background tabs, safely ignore
      }
    }
  }

  private releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release();
      } catch {
        // ignore
      }
      this.wakeLockSentinel = null;
    }
  }

  /**
   * Starts background keep-alive to hold mobile OS wake lock and session priority.
   * Can be called synchronously inside user click/tap handlers.
   * Note: For native media playback (audioEngine), the audio element already holds an audio session.
   */
  public startKeepAlive(): void {
    this.isKeepAliveActive = true;
    this.requestWakeLock();
  }

  /**
   * For YouTube playback:
   * Requests wake lock to keep the PWA engine active. Does NOT start the silent audio carrier,
   * avoiding OS-level audio session hijacking and phantom playback desync.
   */
  public startYouTubeKeepAlive(): void {
    this.isKeepAliveActive = true;
    this.requestWakeLock();
    // Ensure any previously active silent audio carrier is stopped
    if (this.audioEl && !this.audioEl.paused) {
      try {
        this.audioEl.pause();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Stops background keep-alive when user explicitly pauses playback
   */
  public stopKeepAlive(): void {
    this.isKeepAliveActive = false;
    if (this.audioEl && !this.audioEl.paused) {
      try {
        this.audioEl.pause();
      } catch {
        // ignore
      }
    }
    this.releaseWakeLock();
  }

  public isActive(): boolean {
    return this.isKeepAliveActive;
  }
}

export const backgroundAudioKeepAlive = new BackgroundAudioKeepAlive();
