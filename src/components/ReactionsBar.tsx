import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const REACTIONS: { key: string; emoji: string; label: string }[] = [
  { key: 'fire', emoji: '🔥', label: 'Fire' },
  { key: 'rocket', emoji: '🚀', label: 'Rocket' },
  { key: 'bulb', emoji: '💡', label: 'Insight' },
  { key: 'heart', emoji: '❤', label: 'Love' },
];

interface Props {
  postId: string;
  compact?: boolean;
  className?: string;
}

const ReactionsBar = ({ postId, compact = true, className = '' }: Props) => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from('likes')
        .select('emoji, user_id')
        .eq('post_id', postId);
      if (cancelled || !data) return;
      const c: Record<string, number> = {};
      const m: Record<string, boolean> = {};
      for (const row of data as any[]) {
        const e = row.emoji || 'like';
        c[e] = (c[e] || 0) + 1;
        if (user && row.user_id === user.id) m[e] = true;
      }
      setCounts(c);
      setMine(m);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [postId, user]);

  const toggle = async (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }));
      return;
    }
    if (busy) return;
    setBusy(key);
    const has = !!mine[key];
    // Optimistic
    setMine(prev => ({ ...prev, [key]: !has }));
    setCounts(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) + (has ? -1 : 1)) }));
    try {
      if (has) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('emoji', key);
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id, emoji: key });
        if (error) throw error;
      }
    } catch {
      // rollback
      setMine(prev => ({ ...prev, [key]: has }));
      setCounts(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) + (has ? 1 : -1)) }));
      toast.error('Could not save reaction');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {REACTIONS.map(r => {
        const count = counts[r.key] || 0;
        const active = !!mine[r.key];
        return (
          <motion.button
            key={r.key}
            whileTap={{ scale: 1.3 }}
            onClick={(e) => toggle(e, r.key)}
            title={r.label}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-all ${
              active
                ? 'bg-primary/15 border-primary/40 text-primary'
                : 'glass border-border/30 text-muted-foreground hover:text-foreground'
            } ${compact ? '' : 'px-3 py-1 text-xs'}`}
          >
            <span className={compact ? 'text-xs' : 'text-sm'}>{r.emoji}</span>
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </motion.button>
        );
      })}
    </div>
  );
};

export default ReactionsBar;
