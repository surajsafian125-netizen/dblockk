import { motion } from 'framer-motion';
import { TrendingUp, Hash } from 'lucide-react';

const trendingItems = [
  { keyword: '#AIAgents', volume: '2.4M', change: '+184%', type: 'hashtag' },
  { keyword: 'Spatial Computing', volume: '1.8M', change: '+127%', type: 'keyword' },
  { keyword: '#VisionPro', volume: '1.2M', change: '+96%', type: 'hashtag' },
  { keyword: 'Quantum Chips', volume: '980K', change: '+73%', type: 'keyword' },
  { keyword: '#Web5', volume: '870K', change: '+61%', type: 'hashtag' },
];

const GlobalTrends = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="glass glow rounded-2xl p-6 h-full"
  >
    <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
      <TrendingUp className="h-5 w-5 text-primary" />
      Global <span className="text-primary text-glow">Trends</span>
    </h3>
    <div className="space-y-3">
      {trendingItems.map((item, i) => (
        <motion.div
          key={item.keyword}
          initial={{ opacity: 0, x: -15 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center justify-between p-3 rounded-xl bg-background/30 border border-border/30 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
            <Hash className="h-3.5 w-3.5 text-primary/70" />
            <span className="font-medium text-sm">{item.keyword}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{item.volume}</span>
            <span className="text-xs font-semibold text-primary">{item.change}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default GlobalTrends;
