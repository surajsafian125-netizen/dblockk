import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, PlusSquare, Smartphone, MonitorSmartphone } from 'lucide-react';

const DISMISS_KEY = 'dblock-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isIOS = () =>
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isAndroid = () => /Android/i.test(navigator.userAgent);

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true;

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    const mq = window.matchMedia('(display-mode: standalone)');
    const onMode = () => setInstalled(mq.matches || (window.navigator as any).standalone === true);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    mq.addEventListener?.('change', onMode);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      mq.removeEventListener?.('change', onMode);
    };
  }, []);

  return { deferredPrompt, installed };
}

const InstallAppButton = ({ variant = 'icon' }: { variant?: 'icon' | 'full' | 'link' }) => {
  const { deferredPrompt, installed } = useInstallPrompt();
  const [modalOpen, setModalOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  if (installed) return null;

  const ios = typeof navigator !== 'undefined' && isIOS();
  const android = typeof navigator !== 'undefined' && isAndroid();

  const handleClick = async () => {
    if (dismissed) {
      // User dismissed before — allow reopening instructions, but not nagging
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') return;
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <>
      {variant === 'icon' ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className="glass rounded-lg p-2 glass-hover transition-all"
          title="Install App"
          aria-label="Install App"
        >
          <Download className="h-4 w-4" />
        </motion.button>
      ) : variant === 'link' ? (
        <button
          onClick={handleClick}
          className="text-primary font-medium hover:underline underline-offset-4 transition-all"
        >
          Install App
        </button>
      ) : (
        <button
          onClick={handleClick}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all w-full"
        >
          <Download className="h-4 w-4" />
          Install App
        </button>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong glow border border-border/30 rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src="/icon-192.png" alt="D'Block app icon" width={48} height={48} className="rounded-xl" />
                  <div>
                    <h3 className="font-display font-bold text-foreground">Get the App</h3>
                    <p className="text-xs text-muted-foreground">Install D'Block on your device</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="glass rounded-lg p-1.5 glass-hover transition-all"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {ios ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    On iPhone & iPad, install via Safari's Share menu:
                  </p>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                      <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <span className="flex items-center gap-1.5">Tap the <Share className="h-4 w-4 text-primary inline" /> Share button in Safari</span>
                    </li>
                    <li className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                      <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <span className="flex items-center gap-1.5">Scroll down and tap <PlusSquare className="h-4 w-4 text-primary inline" /> "Add to Home Screen"</span>
                    </li>
                    <li className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                      <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <span>Tap "Add" — D'Block appears on your home screen</span>
                    </li>
                  </ol>
                </div>
              ) : android ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    On Android, install via Chrome's menu:
                  </p>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                      <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <span>Tap the ⋮ menu in Chrome</span>
                    </li>
                    <li className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                      <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <span className="flex items-center gap-1.5">Tap <Smartphone className="h-4 w-4 text-primary inline" /> "Install app" or "Add to Home screen"</span>
                    </li>
                    <li className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                      <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <span>Confirm — D'Block launches like a native app</span>
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    On desktop, install from your browser:
                  </p>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                      <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <span className="flex items-center gap-1.5">Look for the <MonitorSmartphone className="h-4 w-4 text-primary inline" /> install icon in the address bar</span>
                    </li>
                    <li className="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
                      <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <span>Click "Install" — D'Block opens in its own window</span>
                    </li>
                  </ol>
                </div>
              )}

              <button
                onClick={closeModal}
                className="mt-5 w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium hover:opacity-90 transition-all glow"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InstallAppButton;
