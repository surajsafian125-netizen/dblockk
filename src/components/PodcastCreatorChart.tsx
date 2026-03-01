import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = [
  'hsl(190, 95%, 55%)',
  'hsl(280, 80%, 65%)',
  'hsl(145, 70%, 50%)',
  'hsl(0, 75%, 60%)',
  'hsl(45, 90%, 60%)',
];

const FALLBACK = [
  { name: 'Unfiltered Talk', value: 42 },
  { name: 'Tech', value: 35 },
  { name: 'Sports', value: 28 },
  { name: 'True Crime', value: 24 },
  { name: 'Business', value: 19 },
];

interface PodcastItem {
  name: string;
  value: number;
  color: string;
}

const PodcastCreatorChart = () => {
  const [data, setData] = useState<PodcastItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const [socRes, techRes] = await Promise.all([
          fetch('https://itunes.apple.com/search?term=society+culture&media=podcast&entity=podcast&limit=3'),
          fetch('https://itunes.apple.com/search?term=technology&media=podcast&entity=podcast&limit=3'),
        ]);

        if (!socRes.ok || !techRes.ok) throw new Error('API error');

        const [socData, techData] = await Promise.all([socRes.json(), techRes.json()]);

        const combined = [
          ...socData.results.slice(0, 3),
          ...techData.results.slice(0, 2),
        ];

        if (combined.length === 0) throw new Error('No results');

        const maxCount = Math.max(...combined.map((p: any) => p.trackCount || 1));
        const mapped: PodcastItem[] = combined.map((p: any, i: number) => ({
          name: (p.trackName || p.collectionName || 'Unknown').slice(0, 18),
          value: Math.round(((p.trackCount || 1) / maxCount) * 100),
          color: COLORS[i % COLORS.length],
        }));

        setData(mapped);
        setIsLive(true);
      } catch {
        setData(FALLBACK.map((d, i) => ({ ...d, color: COLORS[i] })));
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPodcasts();
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
        <Mic className="h-5 w-5 text-primary" />
        Podcast & Creator <span className="text-primary text-glow">Trends</span>
      </h3>

      {loading ? (
        <div className="flex items-center justify-center h-[240px] text-muted-foreground text-sm animate-pulse">
          Fetching live podcast data…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" horizontal={false} />
            <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={10} unit="%" />
            <YAxis type="category" dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={11} width={120} />
            <Tooltip
              contentStyle={{ background: 'hsl(220, 25%, 10%)', border: '1px solid hsl(190, 95%, 55%, 0.2)', borderRadius: '12px', color: 'hsl(210, 20%, 95%)' }}
              formatter={(v: number) => [`${v}%`, 'Popularity']}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
              {data.map((g, i) => (
                <Cell key={i} fill={g.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
};

export default PodcastCreatorChart;
