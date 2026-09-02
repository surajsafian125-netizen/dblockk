import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import ContentCard from './ContentCard';
import PostDetailModal from './PostDetailModal';
import { SkeletonGrid } from './SkeletonCard';
import EmptyState from './EmptyState';
import CategoryFilter from './CategoryFilter';
import { supabase } from '@/integrations/supabase/client';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Newspaper } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';


interface DBPost {
  id: string;
  title: string;
  content: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  category: string;
  tags: string[] | null;
  views: number | null;
  likes_count: number | null;
  reading_time: number | null;
  engagement_score: number | null;
  is_trending: boolean | null;
  published: boolean | null;
  status?: string | null;
  news_category?: string | null;
  created_at: string | null;
}

export interface PostDisplay {
  id: string;
  title: string;
  description: string;
  content: string;
  image: string;
  category: string;
  newsCategory: 'local' | 'global' | null;
  tags: string[];
  views: number;
  likes: number;
  readingTime: number;
  engagementScore: number;
  isTrending: boolean;
  createdAt: string;
  published: boolean;
}

const filters = ['For You', 'Trending', 'Most Viewed', 'Latest', "Editor's Pick"];
const PAGE_SIZE = 9;

const ContentGrid = () => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState(user ? 'For You' : 'Trending');

  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selectedPost, setSelectedPost] = useState<PostDisplay | null>(null);
  const { bookmarkedIds, bookmarkedPosts, toggleBookmark } = useBookmarks();
  const [taste, setTaste] = useState<Record<string, number>>({});

  const [, setNow] = useState(Date.now());
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        setLoading(false);
        return;
      }

      const mapped: PostDisplay[] = (data as DBPost[]).map(p => ({
        id: p.id,
        title: p.title,
        description: p.description || p.content.slice(0, 120) + '...',
        content: p.content,
        image:
          p.image_url ||
          'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
        category: p.category,
        newsCategory: (p.news_category === 'local' || p.news_category === 'global') ? p.news_category : null,
        tags: p.tags || [],
        views: p.views || 0,
        likes: p.likes_count || 0,
        readingTime: p.reading_time || 3,
        engagementScore: p.engagement_score || 0,
        isTrending: p.is_trending || false,
        createdAt: p.created_at || new Date().toISOString(),
        published: p.published ?? true,
      }));

      setPosts(mapped);
      setLoading(false);
    };

    fetchPosts();

    const channel = supabase
      .channel('posts-feed-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    const tick = setInterval(() => setNow(Date.now()), 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(tick);
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => set.add(p.category));
    return ['All', ...Array.from(set).sort()];
  }, [posts]);

  const hashtags = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach(p => p.tags.forEach(t => map.set(t, (map.get(t) || 0) + 1)));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t]) => `#${t}`);
  }, [posts]);

  const filtered = useMemo(() => {
    let list = [...posts];
    if (activeCategory !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
    }
    if (activeTag) {
      list = list.filter(p => p.tags.some(t => `#${t}` === activeTag));
    }
    if (activeFilter === 'Trending') list.sort((a, b) => b.engagementScore - a.engagementScore);
    else if (activeFilter === 'Most Viewed') list.sort((a, b) => b.views - a.views);
    else if (activeFilter === 'Latest')
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [posts, activeCategory, activeTag, activeFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [activeCategory, activeTag, activeFilter]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisible(v => Math.min(v + PAGE_SIZE, filtered.length));
        }
      },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  const handleSelectRelated = useCallback(
    (id: string) => {
      const target = posts.find(p => p.id === id);
      if (target) setSelectedPost(target);
    },
    [posts]
  );

  const shown = filtered.slice(0, visible);

  return (
    <section className="container mx-auto px-4 py-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-display text-3xl font-bold mb-8 text-center"
      >
        Explore <span className="text-primary text-glow">Content</span>
      </motion.h2>

      <div className="mb-4">
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
          className="justify-center flex-wrap sm:flex-nowrap"
        />
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilter === f
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {hashtags.length > 0 && (
        <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
          {hashtags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                activeTag === tag
                  ? 'bg-primary/20 text-primary neon-border'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Newspaper className="h-6 w-6" />}
          title="Nothing here yet"
          description="Try switching category or clearing your tag filter. Fresh drops arrive daily."
          action={
            (activeCategory !== 'All' || activeTag) && (
              <button
                onClick={() => {
                  setActiveCategory('All');
                  setActiveTag(null);
                }}
                className="rounded-xl glass glass-hover px-4 py-2 text-xs font-medium text-primary"
              >
                Reset filters
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map((post, i) => (
              <ContentCard
                key={post.id}
                post={post}
                index={i}
                onClick={() => setSelectedPost(post)}
                isBookmarked={bookmarkedIds.has(post.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </div>
          {visible < filtered.length && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          )}
        </>
      )}

      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        isBookmarked={selectedPost ? bookmarkedIds.has(selectedPost.id) : false}
        onToggleBookmark={toggleBookmark}
        onSelectRelated={handleSelectRelated}
      />
    </section>
  );
};

export default ContentGrid;
