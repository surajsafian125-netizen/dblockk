import { motion } from 'framer-motion';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useEffect, useState, ReactNode } from 'react';
import { formatUpdatedAt } from '@/hooks/useResilientFetch';

interface Props {
  title?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
  error?: string | null;
  updatedAt?: number | null;
  onRefresh?: () => void;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
  padded?: boolean;
}

const WidgetShell = ({
  title,
  icon,
  loading,
  error,
  updatedAt,
  onRefresh,
  actions,
  className = '',
  children,
  padded = true,
}: Props) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`glass glow rounded-2xl overflow-hidden ${className}`}>
      {(title || onRefresh || actions) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/20">
          <div className="flex items-center gap-2 min-w-0">
            {icon && <span className="text-primary shrink-0">{icon}</span>}
            {title && (
              <h3 className="font-display text-sm sm:text-base font-semibold truncate">
                {title}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {updatedAt !== undefined && (
              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                {formatUpdatedAt(updatedAt ?? null)}
              </span>
            )}
            {actions}
            {onRefresh && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onRefresh}
                title="Refresh"
                className="rounded-lg glass glass-hover p-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-primary' : ''}`}
                />
              </motion.button>
            )}
          </div>
        </div>
      )}
      <div className={padded ? 'p-4' : ''}>
        {error && !loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <AlertCircle className="h-6 w-6 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-1 rounded-lg glass glass-hover px-3 py-1.5 text-xs text-primary font-medium"
              >
                Try again
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default WidgetShell;
