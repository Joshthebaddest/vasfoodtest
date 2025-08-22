import React, { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent.toLowerCase());
const isSafari = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');
};
const isChrome = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('chrome') && !ua.includes('edge') && !ua.includes('opr');
};
const isAndroid = () => /android/i.test(window.navigator.userAgent.toLowerCase());
const isInStandaloneMode = () =>
  ('standalone' in window.navigator && (window.navigator as any).standalone) ||
  window.matchMedia('(display-mode: standalone)').matches;

const AUTO_HIDE_MS = 15000; // 15 seconds

const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [messageType, setMessageType] = useState<'manual-ios' | 'ios-chrome' | 'native-install' | null>(null);
  const [visible, setVisible] = useState(false); // for animation

  useEffect(() => {
    if (isInStandaloneMode()) {
      setShowBanner(false);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!localStorage.getItem('pwaInstallDismissed')) {
        setMessageType('native-install');
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for appinstalled event
    const onAppInstalled = () => {
      setShowBanner(false);
      localStorage.setItem('pwaInstallDismissed', 'true');
    };
    window.addEventListener('appinstalled', onAppInstalled);

    // iOS Safari
    if (isIos() && isSafari()) {
      if (!localStorage.getItem('pwaInstallDismissed')) {
        setMessageType('manual-ios');
        setShowBanner(true);
      }
    }

    // iOS Chrome
    if (isIos() && isChrome()) {
      if (!localStorage.getItem('pwaInstallDismissed')) {
        setMessageType('ios-chrome');
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  // Animate banner visibility
  useEffect(() => {
    if (showBanner) {
      setVisible(true);

      // Auto-hide after timeout
      const timeoutId = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setShowBanner(false), 300); // wait for animation
      }, AUTO_HIDE_MS);

      return () => clearTimeout(timeoutId);
    } else {
      setVisible(false);
    }
  }, [showBanner]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setVisible(false);
      setTimeout(() => setShowBanner(false), 300);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setShowBanner(false), 300);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('pwaInstallDismissed', 'true');
    setVisible(false);
    setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 ${
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`relative bg-white text-gray-900 rounded-lg shadow-lg p-6 max-w-sm w-full text-center transform transition-transform duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-10'
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        {messageType === 'manual-ios' && (
          <>
            <p className="text-lg font-semibold mb-4">Install on iOS Safari</p>
            <p className="mb-4">
              To install this app, tap the <strong>Share</strong> button in Safari, then select{' '}
              <strong>Add to Home Screen</strong>.
            </p>
            <button
              onClick={handleDontShowAgain}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded"
            >
              Don't show again
            </button>
          </>
        )}

        {messageType === 'ios-chrome' && (
          <>
            <p className="text-lg font-semibold mb-4">iOS Chrome Not Supported</p>
            <p className="mb-4">
              iOS Chrome does not support PWA installation. Please open this app in Safari to install.
            </p>
            <button
              onClick={handleDontShowAgain}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded"
            >
              Don't show again
            </button>
          </>
        )}

        {messageType === 'native-install' && (
          <>
            <p className="text-lg font-semibold mb-4">Add Vasfood to your device!</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleInstallClick}
                className="bg-black hover:bg-gray-900 text-white font-medium px-4 py-2 rounded"
              >
                Install Now
              </button>
              <button
                onClick={handleDontShowAgain}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded"
              >
                Don't show again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InstallBanner;
