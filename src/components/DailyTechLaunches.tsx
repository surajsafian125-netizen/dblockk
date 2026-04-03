import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Rocket, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface Launch {
  name: string;
  tagline: string;
  url: string;
  imageUrl: string;
  domain: string;
}

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=200&fit=crop',
];

const DailyTechLaunches = () => {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLaunches = async () => {
      try {
        const res = await fetch(
          'https://hn.algolia.com/api/v1/search?tags=show_hn&hitsPerPage=8'
        );
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const hits = data.hits || [];
        if (hits.length === 0) throw new Error('No results');

        const mapped: Launch[] = hits.map((h: any, i: number) => {
          const domain = h.url ? new URL(h.url).hostname.replace('www.', '') : '';
          return {
            name: (h.title || 'Untitled').replace(/^Show HN:\s*/i, '').slice(0, 40),
            tagline: h.url
              ? domain
              : `${h.num_comments ?? 0} comments`,
            url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
            imageUrl: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
            domain,
          };
        });

        setLaunches(mapped);
        setIsLive(true);
      } catch {
        setLaunches(
          ['ArcFlow AI', 'PixelForge 3D', 'CodePilot v2', 'NeuroBrief', 'ShipStack', 'DataMesh'].map((name, i) => ({
            name,
            tagline: 'Innovative tech product',
            url: '',
            imageUrl: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
            domain: '',
          }))
        );
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    };
    fetchLaunches();
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 260;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass glow rounded-2xl p-6 h-full relative"
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.4)]" />
          </span>
          <span className="text-[10px] font-medium text-green-400 uppercase tracking-wider">Live</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Daily Tech <span className="text-primary text-glow">Launches</span>
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => scroll('left')} className="glass glass-hover rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll('right')} className="glass glass-hover rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="min-w-[220px] glass rounded-xl overflow-hidden animate-pulse">
              <div className="h-28 bg-muted/20" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted/20 rounded w-3/4" />
                <div className="h-3 bg-muted/20 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {launches.map((item, i) => (
            <motion.a
              key={i}
              href={item.url || undefined}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="min-w-[180px] max-w-[220px] glass glass-hover rounded-xl overflow-hidden group block shrink-0 border border-border/20"
            >
              {/* Image */}
              <div className="relative h-28 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, hsl(var(--background) / 0.9), transparent 50%)' }}
                />
                {/* Launched Today badge */}
                <div className="absolute top-2 left-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/90 text-primary-foreground rounded-full px-2 py-0.5 shadow-[0_0_10px_hsl(var(--primary)/0.4)]">
                    Launched Today
                  </span>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                <p className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {item.name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">
                  {item.tagline}
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default DailyTechLaunches;
