import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

interface Item {
  id: string;
  title: string;
  image_url: string | null;
  category: string;
}

interface Props {
  postId: string;
  category: string;
  tags: string[];
  onSelect: (id: string) => void;
}

const RelatedPosts = ({ postId, category, tags, onSelect }: Props) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from('posts')
        .select('id, title, image_url, category, tags')
        .eq('published', true)
        .neq('id', postId)
        .order('created_at', { ascending: false })
        .limit(20);
      const { data } = await q;
      if (cancelled) return;
      let candidates = (data || []) as any[];
      // Rank by tag overlap, then category match
      const tagSet = new Set(tags.map(t => t.toLowerCase()));
      candidates = candidates
        .map(p => {
          const overlap = (p.tags || []).filter((t: string) => tagSet.has(t.toLowerCase())).length;
          const cat = p.category?.toLowerCase() === category.toLowerCase() ? 1 : 0;
          return { p, score: overlap * 2 + cat };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(x => x.p);
      setItems(candidates);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, category, tags.join(',')]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-24 rounded-xl glass animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
        Keep reading
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(item.id)}
            className="glass glass-hover rounded-xl overflow-hidden text-left group"
          >
            <div className="h-20 overflow-hidden">
              <img
                src={
                  item.image_url ||
                  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop'
                }
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
              />
            </div>
            <div className="p-2.5">
              <p className="text-[11px] text-primary/80 uppercase tracking-wide mb-1">
                {item.category}
              </p>
              <p className="text-xs font-medium line-clamp-2 flex items-start gap-1">
                {item.title}
                <ArrowUpRight className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts;
