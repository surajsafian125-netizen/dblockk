import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const fixtures = [
  { home: 'Real Madrid', away: 'Man City', homeScore: 2, awayScore: 1, status: 'LIVE', minute: "78'" },
  { home: 'Bayern Munich', away: 'PSG', homeScore: 0, awayScore: 0, status: 'UPCOMING', minute: '20:45' },
  { home: 'Barcelona', away: 'Inter Milan', homeScore: 3, awayScore: 2, status: 'FT', minute: 'FT' },
];

const MatchDay = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="glass glow rounded-2xl p-6 h-full"
  >
    <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
      <Trophy className="h-5 w-5 text-primary" />
      Match <span className="text-primary text-glow">Day</span>
    </h3>
    <div className="space-y-3">
      {fixtures.map((f, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="p-4 rounded-xl bg-background/30 border border-border/30"
        >
          <div className="flex items-center justify-between mb-2">
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0 ${
                f.status === 'LIVE'
                  ? 'border-red-500/50 text-red-400 animate-pulse'
                  : f.status === 'FT'
                  ? 'border-muted-foreground/30 text-muted-foreground'
                  : 'border-primary/30 text-primary/80'
              }`}
            >
              {f.status === 'LIVE' ? `● LIVE ${f.minute}` : f.status === 'FT' ? 'Full Time' : f.minute}
            </Badge>
            <span className="text-[10px] text-muted-foreground">Champions League</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex-1">{f.home}</span>
            <div className="flex items-center gap-2 px-4">
              <span className="font-display text-lg font-bold">{f.homeScore}</span>
              <span className="text-muted-foreground text-xs">-</span>
              <span className="font-display text-lg font-bold">{f.awayScore}</span>
            </div>
            <span className="text-sm font-medium flex-1 text-right">{f.away}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default MatchDay;
