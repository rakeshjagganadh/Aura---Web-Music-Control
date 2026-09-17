import React, { useEffect, useRef } from 'react';
import { youtubePlayerBridge } from '../../services/youtubePlayerBridge';
import { youtubeService } from '../../services/youtubeService';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubeEmbedPlayer: React.FC = () => {
  const playerRef = useRef<any>(null);
  const isInitializingRef = useRef<boolean>(false);
  const timeUpdateInterval = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const createPlayer = () => {
      if (!isMounted) return;
      if (playerRef.current || isInitializingRef.current) return;
      if (!window.YT || !window.YT.Player) return;

      const slot = document.getElementById('aura-yt-iframe-slot');
      if (!slot) return;

      isInitializingRef.current = true;

      try {
        playerRef.current = new window.YT.Player('aura-yt-iframe-slot', {
          height: '180',
          width: '320',
          playerVars: {
            autoplay: 1,
            controls: 1,
            disablekb: 0,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              isInitializingRef.current = false;
              youtubePlayerBridge.registerPlayer(event.target);
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              // YT.PlayerState: UNSTARTED = -1, ENDED = 0, PLAYING = 1, PAUSED = 2, BUFFERING = 3, CUED = 5
              if (event.data === 1) {
                // Confirmed Playing
                youtubePlayerBridge.updateState({ isPlaying: true });
                youtubePlayerBridge.applyPendingSyncSeekIfNeeded();
                const dur = event.target?.getDuration?.();
                if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
                  youtubePlayerBridge.updateState({ duration: dur });
                }
              } else if (event.data === 2) {
                // Paused - cleanly sync state so MediaSession and UI accurately reflect paused status
                youtubePlayerBridge.updateState({ isPlaying: false });
              } else if (event.data === 0) {
                // Confirmed Ended
                youtubePlayerBridge.notifyEnded();
              } else if (event.data === 3 || event.data === 5) {
                // Buffering or Cued
                const dur = event.target?.getDuration?.();
                if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
                  youtubePlayerBridge.updateState({ duration: dur });
                }
              }
            },
            onError: (err: any) => {
              if (!isMounted) return;
              const code = err?.data ?? 0;
              const msg = youtubeService.getErrorMessage(code);
              youtubePlayerBridge.notifyError(code, msg);
            },
          },
        });
      } catch (e) {
        console.warn('Failed to initialize YouTube IFrame Player:', e);
        isInitializingRef.current = false;
      }
    };

    // 1. Check if YT is already loaded
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      // Setup global callback
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        createPlayer();
      };

      // Load YouTube script if not present
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }

    // Polling fallback to check if YT loaded
    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player && !playerRef.current && !isInitializingRef.current) {
        createPlayer();
      }
      if (playerRef.current) {
        clearInterval(checkInterval);
      }
    }, 250);

    // Continuous time & duration poller
    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current && youtubePlayerBridge.isPlayerReady()) {
        try {
          if (!youtubePlayerBridge.getIsSeeking()) {
            const curr = playerRef.current.getCurrentTime?.();
            const dur = playerRef.current.getDuration?.();
            if (typeof curr === 'number' && !isNaN(curr)) {
              youtubePlayerBridge.updateTime(curr, typeof dur === 'number' && !isNaN(dur) ? dur : 0);
            }
          }
        } catch {
          // ignore
        }
      }
    }, 200);

    // Safe foreground auto-restore: only resume playback when returning to the FOREGROUND (visible).
    // Never attempt to force playVideo() while document is hidden, which triggers aggressive loops and OS termination.
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const isExplicit = youtubePlayerBridge.isUserExplicitPause();
        if (!isExplicit && playerRef.current) {
          try {
            const pState = playerRef.current.getPlayerState?.();
            // If paused while backgrounded, restore playback cleanly upon returning to foreground
            if (pState === 2) {
              playerRef.current.playVideo?.();
            }
          } catch {}
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(checkInterval);
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      youtubePlayerBridge.unregisterPlayer();
    };
  }, []);

  return (
    <div
      id="aura-youtube-engine"
      aria-hidden="true"
      className="fixed bottom-0 right-0 w-[320px] h-[180px] -z-50 pointer-events-none opacity-0 overflow-hidden select-none"
    >
      {/* Official YouTube IFrame Mounting Point */}
      <div id="aura-yt-iframe-slot" className="w-full h-full" />
    </div>
  );
};


