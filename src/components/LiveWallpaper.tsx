import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallpaper } from '@/contexts/WallpaperContext';

/**
 * Full-screen animated wallpaper layer shown to signed-in users.
 * Uses a slow Ken Burns pan/zoom plus crossfade between images.
 */
const LiveWallpaper = () => {
  const { isAuthenticated } = useAuth();
  const { activeId, activeUrl } = useWallpaper();

  const active = isAuthenticated && !!activeUrl;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('has-wallpaper', active);
    return () => root.classList.remove('has-wallpaper');
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }} aria-hidden="true">
      <AnimatePresence mode="sync">
        <motion.div
          key={activeId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={activeUrl!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover wallpaper-kenburns"
          />
        </motion.div>
      </AnimatePresence>

      {/* Readability + brand veil */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, hsl(var(--background) / 0.72), hsl(var(--background) / 0.86))',
        }}
      />
      <div className="absolute inset-0 wallpaper-aurora" />
    </div>
  );
};

export default LiveWallpaper;
