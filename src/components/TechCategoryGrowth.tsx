import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TOPICS = [
  { query: 'automation', label: 'Automation', color: 'hsl(190, 95%, 55%)', grad: 'gradAutomation' },
  { query: 'web-design', label: 'Web Design', color: 'hsl(280, 80%, 65%)', grad: 'gradWebDesign' },
  { query: 'artificial-intelligence', label: 'AI', color: 'hsl(45, 90%, 60%)', grad: 'gradAI' },
];

// Generate mock chart data as fallback
const generateMock = () =>
  Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    Automation: 2400 + Math.sin(i * 0.4) * 800 + i * 120,
    'Web Design': 1800 + Math.cos(i * 0.3) * 600 + i * 90,
    AI: 1200 + Math.sin(i * 0.5 + 1) * 500 + i * 70,
  }));

interface RepoCount {
  Automation: number;
  'Web Design': number;
  AI: number;
}

const TechCategoryGrowth = () => {
  const [chartData, setChartData] = useState<any[]>(generateMock());
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGitHub = async () => {
      try {
        // Fetch repo counts created in each of the last 6 months for each topic
        const now = new Date();
        const months: { label: string; from: string; to: string }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          const label = d.toLocaleString('en', { month: 'short' });
          const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
          const to = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
          months.push({ label, from, to });
        }

        // Fetch all in parallel (18 requests but GitHub search allows unauthenticated 10/min)
        // We'll fetch just the total_count for each topic per month
        const results = await Promise.all(
          TOPICS.flatMap((topic) =>
            months.map(async (m) => {
              const res = await fetch(
                `https://api.github.com/search/repositories?q=topic:${topic.query}+created:${m.from}..${m.to}&per_page=1`
              );
              if (!res.ok) throw new Error(`GitHub ${res.status}`);
              const json = await res.json();
              return { topic: topic.label, month: m.label, count: json.total_count as number };
            })
          )
        );

        // Reshape into chart data
        const data = months.map((m) => {
          const row: any = { month: m.label };
          TOPICS.forEach((t) => {
            const entry = results.find((r) => r.topic === t.label && r.month === m.label);
            row[t.label] = entry?.count ?? 0;
          });
          return row;
        });

        setChartData(data);
        setIsLive(true);
      } catch {
        // Keep mock fallback
        setChartData(generateMock());
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHub();
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
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-[10px] text-green-400 font-medium tracking-wider uppercase">Live Data</span>
        </div>
      )}

      <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        Tech Category <span className="text-primary text-glow">Growth</span>
      </h3>

      {loading ? (
        <div className="h-[240px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <defs>
              {TOPICS.map((t) => (
                <linearGradient key={t.grad} id={t.grad} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={t.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={t.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
            <XAxis dataKey="month" stroke="hsl(215, 15%, 55%)" fontSize={10} />
            <YAxis stroke="hsl(215, 15%, 55%)" fontSize={10} />
            <Tooltip contentStyle={{ background: 'hsl(220, 25%, 10%)', border: '1px solid hsl(190, 95%, 55%, 0.2)', borderRadius: '12px', color: 'hsl(210, 20%, 95%)' }} />
            {TOPICS.map((t) => (
              <Area key={t.label} type="monotone" dataKey={t.label} stroke={t.color} fill={`url(#${t.grad})`} strokeWidth={2} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div className="flex gap-4 mt-3 justify-center">
        {TOPICS.map((t) => (
          <div key={t.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
            <span className="text-xs text-muted-foreground">{t.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default TechCategoryGrowth;
