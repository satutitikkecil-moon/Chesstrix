import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const STORAGE_KEYS = ['chesstactix_app_installed', 'chess_app_installed', 'app_installed'];

function checkIsStandaloneOrInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  const isStandaloneMedia =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches;

  const isIOSStandalone =
    (window.navigator as unknown as { standalone?: boolean })?.standalone === true;

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isUrlFlag = 
    urlParams?.get('source') === 'pwa' || 
    urlParams?.get('installed') === 'true' || 
    urlParams?.get('standalone') === 'true';

  const isAndroidTWA =
    typeof document !== 'undefined' &&
    document.referrer?.includes('android-app://');

  const isStoredInstalled = STORAGE_KEYS.some(k => {
    try {
      return localStorage.getItem(k) === 'true';
    } catch {
      return false;
    }
  });

  if (isStandaloneMedia || isIOSStandalone || isUrlFlag || isAndroidTWA) {
    try {
      STORAGE_KEYS.forEach(k => localStorage.setItem(k, 'true'));
    } catch {}
    return true;
  }

  return isStoredInstalled;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => checkIsStandaloneOrInstalled());
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Initial check
    setIsInstalled(checkIsStandaloneOrInstalled());

    const ua = window.navigator.userAgent.toLowerCase();
    setIsAndroid(/android/.test(ua));
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      try {
        STORAGE_KEYS.forEach(k => localStorage.setItem(k, 'true'));
      } catch {}
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.dispatchEvent(new Event('chesstactix_install_change'));
    };

    const handleCustomChange = () => {
      setIsInstalled(checkIsStandaloneOrInstalled());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('chesstactix_install_change', handleCustomChange);
    window.addEventListener('storage', handleCustomChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('chesstactix_install_change', handleCustomChange);
      window.removeEventListener('storage', handleCustomChange);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      // If native prompt isn't supported in browser, mark as installed via manual flow
      try {
        STORAGE_KEYS.forEach(k => localStorage.setItem(k, 'true'));
      } catch {}
      setIsInstalled(true);
      window.dispatchEvent(new Event('chesstactix_install_change'));
      return true;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        try {
          STORAGE_KEYS.forEach(k => localStorage.setItem(k, 'true'));
        } catch {}
        setIsInstalled(true);
        setDeferredPrompt(null);
        window.dispatchEvent(new Event('chesstactix_install_change'));
        return true;
      }
    } catch {
      // Handled silently
    }
    return false;
  };

  const setManualInstalled = useCallback((installed: boolean) => {
    try {
      if (installed) {
        STORAGE_KEYS.forEach(k => localStorage.setItem(k, 'true'));
      } else {
        STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
      }
    } catch {}
    setIsInstalled(installed);
    window.dispatchEvent(new Event('chesstactix_install_change'));
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isAndroid,
    isIOS,
    install,
    setManualInstalled,
    deferredPrompt
  };
}
