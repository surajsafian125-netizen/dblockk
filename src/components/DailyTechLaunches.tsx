import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, ChevronUp } from 'lucide-react';

interface Launch {
  name: string;
  tagline: string;
  upvotes: number;
  url: string;
}

const FALLBACK: Launch[] = [
  { name: 'ArcFlow AI', tagline: 'Autonomous workflow orchestration for teams', upvotes: 1247, url: '' },
  { name: 'PixelForge 3D', tagline: 'AI-powered 3D asset generation from text', upvotes: 983, url: '' },
  { name: 'CodePilot v2', tagline: 'Context-aware code review with GPT-5', upvotes: 871, url: '' },
  { name: 'NeuroBrief', tagline: 'Summarize any document in 10 seconds', upvotes: 654, url: '' },
  { name: 'ShipStack', tagline: 'Launch SaaS products in 48 hours', upvotes: 512, url: '' },
];

const DailyTechLaunches = () => {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLaunches = async () => {
      try {
        // Fetch "Show HN" stories via Algolia HN Search API
        const res = await fetch(
          'https://hn.algolia.com/api/v1/search?tags=show_hn&hitsPerPage=5'
        );
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const hits = data.hits || [];
        if (hits.length === 0) throw new Error('No results');

        const mapped: Launch[] = hits.map((h: any) => ({
          name: (h.title || 'Untitled').replace(/^Show HN:\s*/i, '').slice(0, 50),
          tagline: h.url
            ? new URL(h.url).hostname.replace('www.', '')
            : `${h.num_comments ?? 0} comments`,
          upvotes: h.points ?? 0,
          url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        }));

        setLaunches(mapped);
        setIsLive(true);
      } catch {
        setLaunches(FALLBACK);
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    };
    fetchLaunches();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass glow rounded-2xl p-6 h-full relative"
    >
      {/* Live indicator */}
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
        <Rocket className="h-5 w-5 text-primary" />
        Daily Tech <span className="text-primary text-glow">Launches</span>
      </h3>

      {loading ? (
        <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm animate-pulse">
          Fetching live launches…
        </div>
      ) : (
        <div className="space-y-3">
          {launches.map((item, i) => (
            <motion.a
              key={i}
              href={item.url || undefined}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-background/30 border border-border/30 hover:border-primary/40 transition-colors cursor-pointer block"
            >
              <div className="flex flex-col items-center gap-0.5 min-w-[44px] py-1 rounded-lg border border-primary/30 bg-primary/5">
                <ChevronUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">{item.upvotes}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-tight">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.tagline}</p>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default DailyTechLaunches;
