import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import stadium from '@/assets/option1-stadium-night.jpg.asset.json';
import glass from '@/assets/option2-glass-abstract.jpg.asset.json';
import neon from '@/assets/option3-city-neon.jpg.asset.json';
import fluid from '@/assets/option4-fluid-dark.jpg.asset.json';
import ocean from '@/assets/option5-ocean-life.jpg.asset.json';
import desert from '@/assets/option6-desert-wind.jpg.asset.json';

export type WallpaperId = 'stadium' | 'glass' | 'neon' | 'fluid' | 'ocean' | 'desert';
export type WallpaperChoice = WallpaperId | 'auto' | 'off';

export const WALLPAPERS: { id: WallpaperId; label: string; url: string }[] = [
  { id: 'stadium', label: 'Stadium Night', url: stadium.url },
  { id: 'glass', label: 'Glass Abstract', url: glass.url },
  { id: 'neon', label: 'City Neon', url: neon.url },
  { id: 'fluid', label: 'Fluid Dark', url: fluid.url },
  { id: 'ocean', label: 'Ocean Life', url: ocean.url },
  { id: 'desert', label: 'Desert Wind', url: desert.url },
];

const STORAGE_KEY = 'dblock-wallpaper';
const ROTATE_MS = 20000;

interface Ctx {
  choice: WallpaperChoice;
  setChoice: (c: WallpaperChoice) => void;
  activeId: WallpaperId | null;
  activeUrl: string | null;
}

const WallpaperContext = createContext<Ctx | undefined>(undefined);

export const WallpaperProvider = ({ children }: { children: ReactNode }) => {
  const [choice, setChoiceState] = useState<WallpaperChoice>(() => {
    if (typeof window === 'undefined') return 'auto';
    const saved = window.localStorage.getItem(STORAGE_KEY) as WallpaperChoice | null;
    return saved ?? 'auto';
  });
  const [autoIndex, setAutoIndex] = useState(0);

  const setChoice = (c: WallpaperChoice) => {
    setChoiceState(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (choice !== 'auto') return;
    const interval = setInterval(() => {
      setAutoIndex(prev => (prev + 1) % WALLPAPERS.length);
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, [choice]);

  const activeId = useMemo<WallpaperId | null>(() => {
    if (choice === 'off') return null;
    if (choice === 'auto') return WALLPAPERS[autoIndex % WALLPAPERS.length].id;
    return choice;
  }, [choice, autoIndex]);

  const activeUrl = useMemo(
    () => WALLPAPERS.find(w => w.id === activeId)?.url ?? null,
    [activeId]
  );

  return (
    <WallpaperContext.Provider value={{ choice, setChoice, activeId, activeUrl }}>
      {children}
    </WallpaperContext.Provider>
  );
};

export const useWallpaper = () => {
  const ctx = useContext(WallpaperContext);
  if (!ctx) throw new Error('useWallpaper must be used within WallpaperProvider');
  return ctx;
};
