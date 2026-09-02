import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hash, ArrowLeft, Newspaper } from 'lucide-react';
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

const TagFeed = () => {
  const { tag } = useParams<{ tag: string }>();
  const [posts, setPosts] = useState<PostDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PostDisplay | null>(null);
  const { bookmarkedIds, toggleBookmark } = useBookmarks();

  useEffect(() => {
    if (!tag) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .contains('tags', [tag])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        setPosts(((data as any[]) || []).map(mapPost));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tag]);

  return (
    <div className="min-h-screen gradient-bg relative overflow-x-hidden">
      <Header />
      <main className="relative z-10 container mx-auto px-4 pt-28 pb-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to feed
        </Link>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Hash className="h-7 w-7 text-primary" />
            <span className="text-primary text-glow">{tag}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading…' : `${posts.length} article${posts.length === 1 ? '' : 's'} tagged`}
          </p>
        </motion.div>

        {loading ? (
          <SkeletonGrid count={6} />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Newspaper className="h-6 w-6" />}
            title="No stories with this tag yet"
            description="Try another tag from the trending cloud below."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
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
        )}

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

export default TagFeed;
