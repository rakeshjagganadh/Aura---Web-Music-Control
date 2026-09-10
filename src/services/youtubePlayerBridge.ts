export interface YouTubePlayerBridgeState {
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  videoId: string | null;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  error: { code: number; message: string } | null;
}

export interface YouTubePlayOptions {
  autoplay?: boolean;
  volume?: number;
  isMuted?: boolean;
  playbackRate?: number;
  requestId?: number;
}

type StateListener = (state: YouTubePlayerBridgeState) => void;
type ErrorListener = (code: number, message: string) => void;
type EndListener = () => void;
type TimeListener = (currentTime: number, duration: number) => void;

class YouTubePlayerBridge {
  private playerInstance: any = null;
  private isReady = false;
  private stateListeners: Set<StateListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private endListeners: Set<EndListener> = new Set();
  private timeListeners: Set<TimeListener> = new Set();

  private pendingRequest: {
    videoId: string;
    autoplay: boolean;
    volume?: number;
    isMuted?: boolean;
    playbackRate?: number;
    requestId: number;
  } | null = null;

  private currentState: YouTubePlayerBridgeState = {
    isReady: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    videoId: null,
    volume: 85,
    isMuted: false,
    playbackRate: 1.0,
    error: null,
  };

  private isSeeking = false;
  private seekResumeTimeout: any = null;

  public registerPlayer(player: any) {
    this.playerInstance = player;
    this.isReady = true;
    this.updateState({ isReady: true });

    // Execute any pending playback request that was queued while initializing
    if (this.pendingRequest) {
      const req = this.pendingRequest;
      this.pendingRequest = null;
      this.executeLoadAndPlay(req);
    }
  }

  public unregisterPlayer() {
    this.playerInstance = null;
    this.isReady = false;
    this.pendingRequest = null;
    if (this.seekResumeTimeout) {
      clearTimeout(this.seekResumeTimeout);
      this.seekResumeTimeout = null;
    }
    this.updateState({ isReady: false, isPlaying: false });
  }

  public isPlayerReady(): boolean {
    return this.isReady && !!this.playerInstance;
  }

  public setSeeking(seeking: boolean) {
    this.isSeeking = seeking;
    if (this.seekResumeTimeout) {
      clearTimeout(this.seekResumeTimeout);
      this.seekResumeTimeout = null;
    }
    if (!seeking) {
      // Small grace period (120ms) after drag release so YouTube API applies seek
      // before background polling resumes reading currentTime
      this.seekResumeTimeout = setTimeout(() => {
        this.isSeeking = false;
      }, 120);
    }
  }

  public getIsSeeking(): boolean {
    return this.isSeeking;
  }

  public getState(): YouTubePlayerBridgeState {
    return { ...this.currentState };
  }

  public subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.currentState);
    return () => this.stateListeners.delete(listener);
  }

  public onEnded(listener: EndListener): () => void {
    this.endListeners.add(listener);
    return () => this.endListeners.delete(listener);
  }

  public onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  public onTimeUpdate(listener: TimeListener): () => void {
    this.timeListeners.add(listener);
    return () => this.timeListeners.delete(listener);
  }

  public updateTime(currentTime: number, duration: number) {
    if (this.isSeeking) return;
    this.currentState.currentTime = currentTime;
    if (duration > 0) {
      this.currentState.duration = duration;
    }
    this.timeListeners.forEach((fn) => {
      try {
        fn(currentTime, this.currentState.duration);
      } catch (e) {
        console.error('Error in YouTube time listener:', e);
      }
    });
  }

  public updateState(partial: Partial<YouTubePlayerBridgeState>) {
    this.currentState = { ...this.currentState, ...partial };
    this.stateListeners.forEach((fn) => {
      try {
        fn(this.currentState);
      } catch (e) {
        console.error('Error in YouTube bridge state listener:', e);
      }
    });
  }

  public notifyEnded() {
    this.updateState({ isPlaying: false });
    this.endListeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Error in YouTube bridge end listener:', e);
      }
    });
  }

  public notifyError(code: number, message: string) {
    this.updateState({ error: { code, message }, isPlaying: false });
    this.errorListeners.forEach((fn) => {
      try {
        fn(code, message);
      } catch (e) {
        console.error('Error in YouTube bridge error listener:', e);
      }
    });
  }

  // --- Core Playback Execution ---

  public loadAndPlay(videoId: string, options: YouTubePlayOptions = {}) {
    const autoplay = options.autoplay ?? true;
    const requestId = options.requestId ?? 0;
    const req = {
      videoId,
      autoplay,
      volume: options.volume,
      isMuted: options.isMuted,
      playbackRate: options.playbackRate,
      requestId,
    };

    if (!this.isReady || !this.playerInstance) {
      this.pendingRequest = req;
      this.updateState({ videoId, error: null, currentTime: 0 });
      return;
    }

    this.executeLoadAndPlay(req);
  }

  private executeLoadAndPlay(req: {
    videoId: string;
    autoplay: boolean;
    volume?: number;
    isMuted?: boolean;
    playbackRate?: number;
    requestId: number;
  }) {
    if (!this.playerInstance) return;

    this.updateState({ videoId: req.videoId, error: null, currentTime: 0 });

    try {
      // 1. Apply volume & mute
      if (typeof req.isMuted === 'boolean') {
        this.setMute(req.isMuted);
      }
      if (typeof req.volume === 'number') {
        this.setVolume(req.volume);
      }
      if (typeof req.playbackRate === 'number' && req.playbackRate > 0) {
        this.setPlaybackRate(req.playbackRate);
      }

      // 2. Load or Cue video
      if (req.autoplay) {
        if (typeof this.playerInstance.loadVideoById === 'function') {
          this.playerInstance.loadVideoById(req.videoId);
        }
        if (typeof this.playerInstance.playVideo === 'function') {
          this.playerInstance.playVideo();
        }
      } else {
        if (typeof this.playerInstance.cueVideoById === 'function') {
          this.playerInstance.cueVideoById(req.videoId);
        }
      }

      // 3. Sync initial duration if available
      if (typeof this.playerInstance.getDuration === 'function') {
        const dur = this.playerInstance.getDuration();
        if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
          this.updateState({ duration: dur });
        }
      }
    } catch (err) {
      console.warn('Error executing YouTube video load:', err);
    }
  }

  public play() {
    if (this.playerInstance && typeof this.playerInstance.playVideo === 'function') {
      try {
        this.playerInstance.playVideo();
      } catch (err) {
        console.warn('Could not play YouTube video:', err);
      }
    }
  }

  public pause() {
    if (this.playerInstance && typeof this.playerInstance.pauseVideo === 'function') {
      try {
        this.playerInstance.pauseVideo();
      } catch (err) {
        console.warn('Could not pause YouTube video:', err);
      }
    }
    this.updateState({ isPlaying: false });
  }

  public stop() {
    if (this.playerInstance && typeof this.playerInstance.stopVideo === 'function') {
      try {
        this.playerInstance.stopVideo();
      } catch (err) {
        // ignore
      }
    }
    this.updateState({ isPlaying: false, currentTime: 0 });
  }

  public seekTo(seconds: number) {
    const safeSecs = Math.max(0, isNaN(seconds) ? 0 : seconds);
    if (this.playerInstance && typeof this.playerInstance.seekTo === 'function') {
      try {
        this.playerInstance.seekTo(safeSecs, true);
      } catch (err) {
        console.warn('Could not seek YouTube video:', err);
      }
    }
    this.updateState({ currentTime: safeSecs });
  }

  public setVolume(volume: number) {
    // volume is 0-100
    const clamped = Math.max(0, Math.min(100, Math.round(volume)));
    if (this.playerInstance && typeof this.playerInstance.setVolume === 'function') {
      try {
        this.playerInstance.setVolume(clamped);
      } catch (err) {
        // ignore
      }
    }
    this.updateState({ volume: clamped });
  }

  public setMute(isMuted: boolean) {
    if (this.playerInstance) {
      try {
        if (isMuted && typeof this.playerInstance.mute === 'function') {
          this.playerInstance.mute();
        } else if (!isMuted && typeof this.playerInstance.unMute === 'function') {
          this.playerInstance.unMute();
        }
      } catch (err) {
        // ignore
      }
    }
    this.updateState({ isMuted });
  }

  public setPlaybackRate(rate: number) {
    if (this.playerInstance && typeof this.playerInstance.setPlaybackRate === 'function') {
      try {
        this.playerInstance.setPlaybackRate(rate);
      } catch (err) {
        console.warn('Could not set YouTube playback rate:', err);
      }
    }
    this.updateState({ playbackRate: rate });
  }

  public getCurrentTime(): number {
    if (this.playerInstance && typeof this.playerInstance.getCurrentTime === 'function') {
      try {
        const t = this.playerInstance.getCurrentTime();
        if (typeof t === 'number' && !isNaN(t)) return t;
      } catch {
        // ignore
      }
    }
    return this.currentState.currentTime;
  }

  public getDuration(): number {
    if (this.playerInstance && typeof this.playerInstance.getDuration === 'function') {
      try {
        const d = this.playerInstance.getDuration();
        if (typeof d === 'number' && !isNaN(d) && d > 0) return d;
      } catch {
        // ignore
      }
    }
    return this.currentState.duration;
  }
}

export const youtubePlayerBridge = new YouTubePlayerBridge();
