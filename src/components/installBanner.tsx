import React, { useEffect, useState } from 'react';

const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

useEffect(() => {
  const handler = (e: Event) => {
    e.preventDefault();
    setDeferredPrompt(e as BeforeInstallPromptEvent);
    if (!localStorage.getItem('pwaInstallDismissed')) {
      setShowBanner(true);
    }
  };

  window.addEventListener('beforeinstallprompt', handler);

  return () => {
    window.removeEventListener('beforeinstallprompt', handler);
  };
}, []);


  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setShowBanner(false);
    }
  };

    // Close modal without persisting dismissal
    const handleClose = () => {
        setShowBanner(false);
    };

    // Close modal and persist dismissal in localStorage
    const handleDontShowAgain = () => {
        setShowBanner(false);
        localStorage.setItem('pwaInstallDismissed', 'true');
    };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="relative bg-white text-gray-900 rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
        {/* Close Icon */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        <p className="text-lg font-semibold mb-4">Add Vasfood to your desktop!</p>

        <div className="flex justify-center space-x-4">
          <button
            onClick={handleInstallClick}
            className="bg-black hover:bg-gray-900 text-white font-medium px-4 py-2 rounded"
          >
            Go for it
          </button>
          <button
            onClick={handleDontShowAgain}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded"
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
