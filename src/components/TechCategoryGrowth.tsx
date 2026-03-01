import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = Array.from({ length: 30 }, (_, i) => ({
  day: `D${i + 1}`,
  Automation: 2400 + Math.sin(i * 0.4) * 800 + i * 120,
  'Web Design': 1800 + Math.cos(i * 0.3) * 600 + i * 90,
  'Digital PR': 1200 + Math.sin(i * 0.5 + 1) * 500 + i * 70,
}));

const TechCategoryGrowth = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="glass glow rounded-2xl p-6 h-full"
  >
    <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
      <Activity className="h-5 w-5 text-primary" />
      Tech Category <span className="text-primary text-glow">Growth</span>
    </h3>
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradAutomation" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(190, 95%, 55%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(190, 95%, 55%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradWebDesign" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(280, 80%, 65%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(280, 80%, 65%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradDigitalPR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(45, 90%, 60%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(45, 90%, 60%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
        <XAxis dataKey="day" stroke="hsl(215, 15%, 55%)" fontSize={10} interval={4} />
        <YAxis stroke="hsl(215, 15%, 55%)" fontSize={10} />
        <Tooltip contentStyle={{ background: 'hsl(220, 25%, 10%)', border: '1px solid hsl(190, 95%, 55%, 0.2)', borderRadius: '12px', color: 'hsl(210, 20%, 95%)' }} />
        <Area type="monotone" dataKey="Automation" stroke="hsl(190, 95%, 55%)" fill="url(#gradAutomation)" strokeWidth={2} />
        <Area type="monotone" dataKey="Web Design" stroke="hsl(280, 80%, 65%)" fill="url(#gradWebDesign)" strokeWidth={2} />
        <Area type="monotone" dataKey="Digital PR" stroke="hsl(45, 90%, 60%)" fill="url(#gradDigitalPR)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
    <div className="flex gap-4 mt-3 justify-center">
      {[
        { label: 'Automation', color: 'hsl(190, 95%, 55%)' },
        { label: 'Web Design', color: 'hsl(280, 80%, 65%)' },
        { label: 'Digital PR', color: 'hsl(45, 90%, 60%)' },
      ].map(l => (
        <div key={l.label} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
          <span className="text-xs text-muted-foreground">{l.label}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

export default TechCategoryGrowth;
