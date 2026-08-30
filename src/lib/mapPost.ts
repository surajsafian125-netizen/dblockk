import type { PostDisplay } from '@/components/ContentGrid';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop';

/** Maps a raw `posts` row from Supabase into the shared PostDisplay shape. */
export function mapPost(p: any): PostDisplay {
  return {
    id: p.id,
    title: p.title,
    description: p.description || (p.content ? `${p.content.slice(0, 120)}...` : ''),
    content: p.content || '',
    image: p.image_url || FALLBACK_IMAGE,
    category: p.category,
    newsCategory:
      p.news_category === 'local' || p.news_category === 'global' ? p.news_category : null,
    tags: p.tags || [],
    views: p.views || 0,
    likes: p.likes_count || 0,
    readingTime: p.reading_time || 3,
    engagementScore: p.engagement_score || 0,
    isTrending: p.is_trending || false,
    createdAt: p.created_at || new Date().toISOString(),
    published: p.published ?? true,
  };
}
