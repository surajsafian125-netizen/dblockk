import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useRecordStreak } from '@/hooks/useProfile';

const StreakBadge = ({ className = '' }: { className?: string }) => {
  const streak = useRecordStreak();
  if (!streak || streak.current_streak < 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      title={`${streak.current_streak}-day reading streak · longest ${streak.longest_streak}`}
      className={`flex items-center gap-1 rounded-full glass px-2.5 py-1 text-[11px] font-semibold text-primary ${className}`}
    >
      <Flame className="h-3.5 w-3.5" />
      {streak.current_streak}
    </motion.div>
  );
};

export default StreakBadge;
