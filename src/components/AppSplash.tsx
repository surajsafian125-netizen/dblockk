import { motion } from 'framer-motion';

const AppSplash = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gradient-bg">
    {/* Glowing orb */}
    <motion.div
      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      className="absolute w-64 h-64 rounded-full"
      style={{
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.25), transparent 70%)',
        filter: 'blur(40px)',
      }}
    />

    {/* Logo text */}
    <motion.h1
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="font-display text-5xl font-bold tracking-tight relative z-10"
      style={{ animation: 'glow-pulse 2.5s ease-in-out infinite' }}
    >
      <span className="text-primary">D'Block</span>
    </motion.h1>

    {/* Subtitle */}
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="text-muted-foreground text-sm mt-3 tracking-widest uppercase relative z-10"
    >
      Loading experience
    </motion.p>

    {/* Animated bar */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-8 w-48 h-1 rounded-full overflow-hidden glass relative z-10"
    >
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        className="h-full w-1/2 rounded-full bg-primary/80"
        style={{ boxShadow: '0 0 16px hsl(var(--primary) / 0.5)' }}
      />
    </motion.div>
  </div>
);

export default AppSplash;
