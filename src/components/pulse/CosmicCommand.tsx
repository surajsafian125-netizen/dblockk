import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ApodData {
  title: string;
  url: string;
  hdurl?: string;
  date: string;
  explanation: string;
  media_type: string;
}

const CosmicCommand = () => {
  const [apod, setApod] = useState<ApodData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApod = async () => {
      try {
        const res = await fetch(
          'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY'
        );
        const data: ApodData = await res.json();
        setApod(data);
      } catch {
        // silent
      }
      setLoading(false);
    };
    fetchApod();
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-2xl h-72 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!apod || apod.media_type !== 'image') {
    return (
      <div className="glass rounded-2xl h-72 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Cosmic data unavailable today.
        </p>
      </div>
    );
  }

  const imageUrl = apod.hdurl || apod.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden h-80 sm:h-96 group"
    >
      {/* Background image */}
      <img
        src={imageUrl}
        alt={apod.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />

      {/* Dark gradient overlay from bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

      {/* Top-right badge */}
      <div className="absolute top-4 right-4 z-10">
        <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/50 bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
          NASA · APOD
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-10">
        <p className="font-mono text-[11px] text-white/40 uppercase tracking-[0.15em] mb-2">
          {new Date(apod.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <h3 className="font-mono text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight">
          {apod.title}
        </h3>
        <p className="text-white/50 text-xs mt-3 line-clamp-2 max-w-2xl font-mono">
          {apod.explanation}
        </p>
      </div>

      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />
    </motion.div>
  );
};

export default CosmicCommand;
