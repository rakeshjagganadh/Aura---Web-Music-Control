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

  // Ultra-lightweight valid 16-bit PCM silent WAV data URI (0.1s silence)
  private readonly SILENT_AUDIO_URI =
    'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

  constructor() {
    if (typeof window !== 'undefined') {
      this.initElement();
      this.setupVisibilityListeners();
    }
  }

  private initElement() {
    if (typeof document === 'undefined') return;

    let el = document.getElementById('aura-background-keepalive') as HTMLAudioElement | null;
    if (!el) {
      el = document.createElement('audio');
      el.id = 'aura-background-keepalive';
      el.src = this.SILENT_AUDIO_URI;
      el.loop = true;
      el.preload = 'auto';
      // Volume must not be strictly 0 for mobile OS audio managers to grant background audio priority
      el.volume = 0.001;
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
      if (document.visibilityState === 'hidden') {
        // Tab went to background: make sure keepalive is humming if music was playing
        if (this.isKeepAliveActive && this.audioEl && this.audioEl.paused) {
          this.audioEl.play().catch(() => {});
        }
      } else if (document.visibilityState === 'visible') {
        // Re-acquire wake lock if needed
        if (this.isKeepAliveActive) {
          this.requestWakeLock();
        }
      }
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
   * Starts background keep-alive to hold mobile OS audio session priority
   */
  public async startKeepAlive(): Promise<void> {
    this.isKeepAliveActive = true;
    if (!this.audioEl) {
      this.initElement();
    }

    if (this.audioEl && this.audioEl.paused) {
      try {
        await this.audioEl.play();
      } catch {
        // User gesture required on initial load; will succeed on first play click
      }
    }

    this.requestWakeLock();
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
