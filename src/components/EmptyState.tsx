import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const EmptyState = ({ icon, title, description, action, className = '' }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl px-6 py-12 text-center flex flex-col items-center gap-3 ${className}`}
    >
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [0, 4, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <div className="absolute inset-0 blur-2xl bg-primary/30 rounded-full" />
        <div className="relative h-14 w-14 rounded-2xl glass glow flex items-center justify-center text-primary">
          {icon || <Sparkles className="h-6 w-6" />}
        </div>
      </motion.div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
