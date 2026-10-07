import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// Where the Android APK lives. Drop `dblock.apk` into the site's
// `public/downloads/` folder and this button starts offering it automatically.
export const APK_PATH = '/downloads/dblock.apk';
export const APK_FILENAME = 'dblock.apk';

type Availability = 'checking' | 'ready' | 'soon';

// The host serves the SPA fallback (text/html) for missing files,
// so content-type must be checked alongside the status.
export function useApkAvailability(): Availability {
  const [state, setState] = useState<Availability>('checking');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(APK_PATH, { method: 'HEAD', cache: 'no-store' });
        const isFile =
          res.ok && !(res.headers.get('content-type') || '').includes('text/html');
        if (alive) setState(isFile ? 'ready' : 'soon');
      } catch {
        if (alive) setState('soon');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

interface AndroidDownloadButtonProps {
  className?: string;
  label?: string;
  /** 'primary' = filled button, 'ghost' = glass button */
  variant?: 'primary' | 'ghost';
}

const AndroidDownloadButton = ({
  className = '',
  label = 'Download for Android',
  variant = 'primary',
}: AndroidDownloadButtonProps) => {
  const availability = useApkAvailability();

  const handleClick = (e: React.MouseEvent) => {
    if (availability === 'ready') return; // native <a> download proceeds
    e.preventDefault();
    toast.info("The D'Block Android app isn't published yet — check back soon.", {
      description: 'The download button goes live the moment the APK is added.',
    });
  };

  const content = (
    <>
      <Smartphone className="h-4 w-4" />
      <span>{label}</span>
      {availability === 'ready' && <Download className="h-4 w-4" />}
      {availability === 'soon' && (
        <span className="text-[10px] uppercase tracking-wider opacity-70">Soon</span>
      )}
    </>
  );

  const base = `inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all ${className}`;
  const styles =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground px-5 py-2.5 hover:opacity-90 glow'
      : 'glass glass-hover px-5 py-2.5';

  if (availability === 'ready') {
    return (
      <motion.a
        whileTap={{ scale: 0.96 }}
        href={APK_PATH}
        download={APK_FILENAME}
        onClick={handleClick}
        className={`${base} ${styles}`}
        aria-label={label}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={handleClick}
      className={`${base} ${styles}`}
      aria-label={label}
    >
      {content}
    </motion.button>
  );
};

export default AndroidDownloadButton;
