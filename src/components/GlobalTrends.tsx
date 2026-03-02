import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Hash } from 'lucide-react';

interface TrendItem {
  keyword: string;
  volume: string;
  url: string;
}

const FALLBACK: TrendItem[] = [
  { keyword: '#AIAgents', volume: '2.4M', url: '' },
  { keyword: 'Spatial Computing', volume: '1.8M', url: '' },
  { keyword: '#VisionPro', volume: '1.2M', url: '' },
  { keyword: 'Quantum Chips', volume: '980K', url: '' },
  { keyword: '#Web5', volume: '870K', url: '' },
];

const formatViews = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const GlobalTrends = () => {
  const [items, setItems] = useState<TrendItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        // Wikipedia most-viewed articles (yesterday)
        const yesterday = new Date(Date.now() - 86400000);
        const y = yesterday.getFullYear();
        const m = String(yesterday.getMonth() + 1).padStart(2, '0');
        const d = String(yesterday.getDate()).padStart(2, '0');
        const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${y}/${m}/${d}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const articles = data?.items?.[0]?.articles ?? [];

        // Filter out generic pages
        const skip = new Set(['Main_Page', 'Special:Search', '-', 'Wikipedia:Featured_pictures']);
        const filtered = articles.filter((a: any) => !skip.has(a.article) && !a.article.startsWith('Special:'));

        const mapped: TrendItem[] = filtered.slice(0, 5).map((a: any) => ({
          keyword: a.article.replace(/_/g, ' '),
          volume: formatViews(a.views ?? 0),
          url: `https://en.wikipedia.org/wiki/${a.article}`,
        }));

        if (mapped.length === 0) throw new Error('No results');
        setItems(mapped);
        setIsLive(true);
      } catch {
        setItems(FALLBACK);
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass glow rounded-2xl p-6 h-full relative"
    >
      {isLive && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.4)]" />
          </span>
          <span className="text-[10px] font-medium text-green-400 uppercase tracking-wider">Live Data</span>
        </div>
      )}

      <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Global <span className="text-primary text-glow">Trends</span>
      </h3>

      {loading ? (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm animate-pulse">
          Fetching global trends…
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.a
              key={i}
              href={item.url || undefined}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center justify-between p-3 rounded-xl bg-background/30 border border-border/30 hover:border-primary/40 transition-colors cursor-pointer block"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                <Hash className="h-3.5 w-3.5 text-primary/70" />
                <span className="font-medium text-sm">{item.keyword}</span>
              </div>
              <span className="text-xs text-muted-foreground">{item.volume} views</span>
            </motion.a>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default GlobalTrends;
