import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Hash, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TagRow {
  tag: string;
  uses: number;
  score: number;
}

const TrendingTags = ({ limit = 18, className = '' }: { limit?: number; className?: string }) => {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc('trending_tags', { p_days: 180, p_limit: limit })
      .then(({ data }) => {
        if (cancelled) return;
        setTags(((data as TagRow[]) || []).filter(t => t.tag));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (loading) {
    return (
      <div className={`glass rounded-2xl p-5 ${className}`}>
        <div className="h-4 w-32 rounded bg-muted/30 animate-pulse mb-4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 w-20 rounded-full bg-muted/20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (tags.length === 0) return null;

  const max = Math.max(...tags.map(t => Number(t.score) || 1));

  return (
    <div className={`glass rounded-2xl p-5 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider">
          Trending tags
        </h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t, i) => {
          const weight = Number(t.score) / max;
          const size = 0.72 + weight * 0.45;
          return (
            <motion.div
              key={t.tag}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i, 12) * 0.02 }}
            >
              <Link
                to={`/tag/${encodeURIComponent(t.tag)}`}
                style={{ fontSize: `${size}rem` }}
                className={`inline-flex items-center gap-0.5 rounded-full px-3 py-1 transition-all hover:scale-105 ${
                  weight > 0.6
                    ? 'bg-primary/15 text-primary neon-border'
                    : 'glass glass-hover text-muted-foreground hover:text-primary'
                }`}
              >
                <Hash className="h-3 w-3" />
                {t.tag}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingTags;
