import { motion } from 'framer-motion';
import { Rocket, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const launches = [
  { name: 'ArcFlow AI', tagline: 'Autonomous workflow orchestration for teams', upvotes: 1247, tags: ['AI', 'Productivity'] },
  { name: 'PixelForge 3D', tagline: 'AI-powered 3D asset generation from text', upvotes: 983, tags: ['Design', 'AI'] },
  { name: 'CodePilot v2', tagline: 'Context-aware code review with GPT-5', upvotes: 871, tags: ['Developer Tools'] },
  { name: 'NeuroBrief', tagline: 'Summarize any document in 10 seconds', upvotes: 654, tags: ['AI', 'Writing'] },
  { name: 'ShipStack', tagline: 'Launch SaaS products in 48 hours', upvotes: 512, tags: ['SaaS', 'No-Code'] },
];

const DailyTechLaunches = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="glass glow rounded-2xl p-6 h-full"
  >
    <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
      <Rocket className="h-5 w-5 text-primary" />
      Daily Tech <span className="text-primary text-glow">Launches</span>
    </h3>
    <div className="space-y-3">
      {launches.map((item, i) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, x: -15 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="flex items-start gap-3 p-3 rounded-xl bg-background/30 border border-border/30 hover:border-primary/40 transition-colors"
        >
          <button className="flex flex-col items-center gap-0.5 min-w-[44px] py-1 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
            <ChevronUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">{item.upvotes}</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-tight">{item.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.tagline}</p>
            <div className="flex gap-1.5 mt-1.5">
              {item.tags.map(t => (
                <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary/80">{t}</Badge>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

export default DailyTechLaunches;
