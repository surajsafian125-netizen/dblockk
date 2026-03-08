import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PostDisplay } from '@/components/ContentGrid';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<PostDisplay[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!user) { setBookmarkedIds(new Set()); setBookmarkedPosts([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('bookmarks')
      .select('post_id, posts(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setBookmarkedIds(new Set(data.map((b: any) => b.post_id)));
      setBookmarkedPosts(
        data
          .filter((b: any) => b.posts)
          .map((b: any) => {
            const p = b.posts;
            return {
              id: p.id,
              title: p.title,
              description: p.description || p.content?.slice(0, 120) + '...',
              content: p.content,
              image: p.image_url || 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
              category: p.category,
              tags: p.tags || [],
              views: p.views || 0,
              likes: p.likes_count || 0,
              readingTime: p.reading_time || 3,
              engagementScore: p.engagement_score || 0,
              isTrending: p.is_trending || false,
              createdAt: p.created_at || new Date().toISOString(),
              published: p.published ?? true,
            } as PostDisplay;
          })
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBookmarks(); }, [fetchBookmarks]);

  const toggleBookmark = useCallback(async (postId: string) => {
    if (!user) return;
    const isBookmarked = bookmarkedIds.has(postId);
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', user.id);
      setBookmarkedIds(prev => { const n = new Set(prev); n.delete(postId); return n; });
      setBookmarkedPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      await supabase.from('bookmarks').insert({ post_id: postId, user_id: user.id });
      setBookmarkedIds(prev => new Set(prev).add(postId));
      // Refetch to get full post data
      fetchBookmarks();
    }
  }, [user, bookmarkedIds, fetchBookmarks]);

  return { bookmarkedIds, bookmarkedPosts, toggleBookmark, loading };
}
