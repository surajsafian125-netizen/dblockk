import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TopPost {
  id: string;
  title: string;
  views: number | null;
  likes_count: number | null;
}

const RealAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    posts: 0,
    published: 0,
    views: 0,
    reactions: 0,
    bookmarks: 0,
    comments: 0,
    subscribers: 0,
    profiles: 0,
    subsThisWeek: 0,
  });
  const [top, setTop] = useState<TopPost[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      const count = { count: 'exact' as const, head: true };
      const [
        postsAll,
        postsPub,
        likes,
        bookmarks,
        comments,
        subs,
        subsWeek,
        profiles,
        topPosts,
        viewRows,
      ] = await Promise.all([
        supabase.from('posts').select('id', count),
        supabase.from('posts').select('id', count).eq('published', true),
        supabase.from('likes').select('id', count),
        supabase.from('bookmarks').select('id', count),
        supabase.from('comments').select('id', count),
        supabase.from('digest_subscribers').select('id', count),
        supabase.from('digest_subscribers').select('id', count).gte('created_at', weekAgo),
        supabase.from('profiles').select('id', count),
        supabase
          .from('posts')
          .select('id, title, views, likes_count')
          .eq('published', true)
          .order('views', { ascending: false })
          .limit(8),
        supabase.from('posts').select('views').eq('published', true).limit(1000),
      ]);

      setStats({
        posts: postsAll.count ?? 0,
        published: postsPub.count ?? 0,
        views: (viewRows.data ?? []).reduce((a, r) => a + (r.views ?? 0), 0),
        reactions: likes.count ?? 0,
        bookmarks: bookmarks.count ?? 0,
        comments: comments.count ?? 0,
        subscribers: subs.count ?? 0,
        subsThisWeek: subsWeek.count ?? 0,
        profiles: profiles.count ?? 0,
      });
      setTop((topPosts.data as TopPost[]) ?? []);
      setLoading(false);
    };
    run();
  }, []);

  const cards = [
    { label: 'Total views', value: stats.views },
    { label: 'Published posts', value: stats.published },
    { label: 'Reactions', value: stats.reactions },
    { label: 'Bookmarks', value: stats.bookmarks },
    { label: 'Comments', value: stats.comments },
    { label: 'Members', value: stats.profiles },
    { label: 'Digest subscribers', value: stats.subscribers },
    { label: 'New subs (7d)', value: stats.subsThisWeek },
  ];

  const maxViews = Math.max(1, ...top.map(t => t.views ?? 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-5 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold">Live Analytics</h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Crunching numbers…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {cards.map(c => (
              <div key={c.label} className="glass rounded-xl p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <p className="font-display text-xl font-bold text-primary">
                  {c.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            Top articles by views
          </p>
          <div className="space-y-2">
            {top.map(t => (
              <div key={t.id} className="glass rounded-xl p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm line-clamp-1">{t.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(t.views ?? 0).toLocaleString()} views · {t.likes_count ?? 0} ♥
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${((t.views ?? 0) / maxViews) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {top.length === 0 && (
              <p className="text-sm text-muted-foreground">No published posts yet.</p>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default RealAnalytics;
