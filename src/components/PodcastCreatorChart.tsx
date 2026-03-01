import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const genres = [
  { name: 'Unfiltered Talk', value: 42, color: 'hsl(190, 95%, 55%)' },
  { name: 'Tech', value: 35, color: 'hsl(280, 80%, 65%)' },
  { name: 'Sports', value: 28, color: 'hsl(145, 70%, 50%)' },
  { name: 'True Crime', value: 24, color: 'hsl(0, 75%, 60%)' },
  { name: 'Business', value: 19, color: 'hsl(45, 90%, 60%)' },
];

const PodcastCreatorChart = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="glass glow rounded-2xl p-6 h-full"
  >
    <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
      <Mic className="h-5 w-5 text-primary" />
      Podcast & Creator <span className="text-primary text-glow">Dominance</span>
    </h3>
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={genres} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" horizontal={false} />
        <XAxis type="number" stroke="hsl(215, 15%, 55%)" fontSize={10} unit="%" />
        <YAxis type="category" dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={11} width={100} />
        <Tooltip
          contentStyle={{ background: 'hsl(220, 25%, 10%)', border: '1px solid hsl(190, 95%, 55%, 0.2)', borderRadius: '12px', color: 'hsl(210, 20%, 95%)' }}
          formatter={(v: number) => [`${v}%`, 'Share']}
        />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
          {genres.map((g, i) => (
            <Cell key={i} fill={g.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);

export default PodcastCreatorChart;
