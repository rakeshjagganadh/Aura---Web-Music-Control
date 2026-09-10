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
                const dur = event.target?.getDuration?.();
                if (typeof dur === 'number' && !isNaN(dur) && dur > 0) {
                  youtubePlayerBridge.updateState({ duration: dur });
                }
              } else if (event.data === 2) {
                // Confirmed Paused
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

    return () => {
      isMounted = false;
      clearInterval(checkInterval);
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
      youtubePlayerBridge.unregisterPlayer();
    };
  }, []);

  return (
    <div
      id="aura-youtube-engine"
      aria-hidden="true"
      className="fixed -top-[9999px] -left-[9999px] w-[320px] h-[180px] opacity-0 pointer-events-none overflow-hidden -z-50 select-none"
    >
      {/* Official YouTube IFrame Mounting Point */}
      <div id="aura-yt-iframe-slot" className="w-full h-full" />
    </div>
  );
};


