import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, SlidersHorizontal, Newspaper } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentCard from '@/components/ContentCard';
import PostDetailModal from '@/components/PostDetailModal';
import { SkeletonGrid } from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import TrendingTags from '@/components/TrendingTags';
import { supabase } from '@/integrations/supabase/client';
import { useBookmarks } from '@/hooks/useBookmarks';
import { mapPost } from '@/lib/mapPost';
import type { PostDisplay } from '@/components/ContentGrid';

const DATE_RANGES = [
  { label: 'Any time', days: null },
  { label: '24 hours', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
];

const SOURCES = [
  { label: 'All sources', value: null },
  { label: 'Local', value: 'local' },
  { label: 'Global', value: 'global' },
];

const Search = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [category, setCategory] = useState<string | null>(params.get('category'));
  const [source, setSource] = useState<string | null>(params.get('source'));
  const [days, setDays] = useState<number | null>(params.get('days') ? Number(params.get('days')) : null);
  const [categories, setCategories] = useState<string[]>([]);
  const [results, setResults] = useState<PostDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PostDisplay | null>(null);
  const { bookmarkedIds, toggleBookmark } = useBookmarks();

  useEffect(() => {
    supabase
      .from('posts')
      .select('category')
      .eq('published', true)
      .then(({ data }) => {
        const set = new Set<string>();
        (data || []).forEach((r: any) => r.category && set.add(r.category));
        setCategories(Array.from(set).sort());
      });
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    const from = days ? new Date(Date.now() - days * 86400000).toISOString() : null;
    const { data, error } = await supabase.rpc('search_posts', {
      q: q.trim(),
      p_category: category,
      p_news_category: source,
      p_from: from,
      p_to: null,
      p_limit: 60,
      p_offset: 0,
    });
    if (error) console.error('search error', error);
    setResults(((data as any[]) || []).map(mapPost));
    setLoading(false);
  }, [q, category, source, days]);

  // Sync URL + fetch (debounced on query text)
  useEffect(() => {
    const t = setTimeout(() => {
      const next: Record<string, string> = {};
      if (q.trim()) next.q = q.trim();
      if (category) next.category = category;
      if (source) next.source = source;
      if (days) next.days = String(days);
      setParams(next, { replace: true });
      run();
    }, 300);
    return () => clearTimeout(t);
  }, [q, category, source, days, run, setParams]);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
      active
        ? 'bg-primary/20 text-primary border-primary/40 glow'
        : 'glass glass-hover border-border/30 text-muted-foreground hover:text-foreground'
    }`;

  return (
    <div className="min-h-screen gradient-bg relative overflow-x-hidden">
      <Header />
      <main className="relative z-10 container mx-auto px-4 pt-28 pb-16">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-5">
            Search <span className="text-primary text-glow">D'Block</span>
          </h1>

          <div className="glass-strong rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 rounded-xl glass px-4 py-3">
              <SearchIcon className="h-4 w-4 text-primary shrink-0" />
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search articles, topics, people…"
                className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <button onClick={() => setCategory(null)} className={chip(!category)}>
                All categories
              </button>
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={chip(category === c)}>
                  {c}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {DATE_RANGES.map(d => (
                <button key={d.label} onClick={() => setDays(d.days)} className={chip(days === d.days)}>
                  {d.label}
                </button>
              ))}
              {SOURCES.map(s => (
                <button key={s.label} onClick={() => setSource(s.value)} className={chip(source === s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="mt-8">
          {loading ? (
            <SkeletonGrid count={6} />
          ) : results.length === 0 ? (
            <EmptyState
              icon={<Newspaper className="h-6 w-6" />}
              title={q.trim() ? 'No matches' : 'Start typing to search'}
              description="Full-text search runs across every published article's title, summary, and body."
            />
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                {results.length} result{results.length === 1 ? '' : 's'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((post, i) => (
                  <ContentCard
                    key={post.id}
                    post={post}
                    index={i}
                    onClick={() => setSelected(post)}
                    isBookmarked={bookmarkedIds.has(post.id)}
                    onToggleBookmark={toggleBookmark}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-12">
          <TrendingTags />
        </div>
      </main>

      <PostDetailModal
        post={selected}
        onClose={() => setSelected(null)}
        isBookmarked={selected ? bookmarkedIds.has(selected.id) : false}
        onToggleBookmark={toggleBookmark}
      />
      <Footer />
    </div>
  );
};

export default Search;
