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

      {/* Themed motion overlays */}
      {activeId === 'ocean' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(14)].map((_, i) => (
            <span
              key={i}
              className="wallpaper-bubble"
              style={{
                left: `${(i * 37) % 100}%`,
                width: `${6 + ((i * 13) % 14)}px`,
                height: `${6 + ((i * 13) % 14)}px`,
                animationDuration: `${9 + ((i * 7) % 10)}s`,
                animationDelay: `${-((i * 3.1) % 12)}s`,
              }}
            />
          ))}
        </div>
      )}
      {activeId === 'desert' && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <span
              key={i}
              className="wallpaper-sand"
              style={{
                top: `${(i * 11) % 100}%`,
                animationDuration: `${5 + ((i * 3) % 6)}s`,
                animationDelay: `${-((i * 1.7) % 8)}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveWallpaper;
