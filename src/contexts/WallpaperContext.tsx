import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type WallpaperId = 'stadium' | 'glass' | 'neon' | 'fluid' | 'ocean' | 'desert';
export type WallpaperChoice = WallpaperId | 'auto' | 'off';

export const WALLPAPERS: { id: WallpaperId; label: string; url: string }[] = [
  { 
    id: 'stadium', 
    label: 'Stadium Night', 
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1920&q=80' 
  },
  { 
    id: 'glass', 
    label: 'Glass Abstract', 
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80' 
  },
  { 
    id: 'neon', 
    label: 'City Neon', 
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1920&q=80' 
  },
  { 
    id: 'fluid', 
    label: 'Fluid Dark', 
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=80' 
  },
  { 
    id: 'ocean', 
    label: 'Ocean Life', 
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1920&q=80' 
  },
  { 
    id: 'desert', 
    label: 'Desert Wind', 
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=80' 
  },
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