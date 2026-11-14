import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = 'aura_pwa_banner_dismissed_until';
const DISMISS_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    return isStandalone;
  });

  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isSafari, setIsSafari] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (!dismissedUntil) return false;
    const expiry = parseInt(dismissedUntil, 10);
    return Date.now() < expiry;
  });
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Standalone & Platform Detection
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    // Platform user agent parsing
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.maxTouchPoints > 1 && /macintosh/.test(ua));
    const isAndroidDevice = /android/.test(ua);
    const isSafariBrowser =
      /safari/.test(ua) && !/chrome|crios|crmo|firefox|fxios|edg/.test(ua);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsSafari(isSafariBrowser);

    // 2. Capture Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 3. Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstructionsOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismissBanner = useCallback(() => {
    const expiry = Date.now() + DISMISS_DURATION_MS;
    localStorage.setItem(DISMISS_KEY, expiry.toString());
    setIsBannerDismissed(true);
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (err) {
        console.warn('[AURA PWA] Install prompt error:', err);
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    // On iOS or when native prompt is not directly callable:
    // Provide explicit AURA-native installation guide
    setIsInstructionsOpen(true);
  }, [deferredPrompt]);

  const canInstall = !isInstalled && (!!deferredPrompt || isIOS);

  return {
    isInstalled,
    canInstall,
    isIOS,
    isAndroid,
    isSafari,
    hasNativePrompt: !!deferredPrompt,
    isBannerDismissed,
    isInstructionsOpen,
    setIsInstructionsOpen,
    dismissBanner,
    promptInstall,
  };
}
