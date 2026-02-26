import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentCard from './ContentCard';
import { supabase } from '@/integrations/supabase/client';

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
  created_at: string | null;
}

export interface PostDisplay {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  readingTime: number;
  engagementScore: number;
  isTrending: boolean;
  createdAt: string;
  published: boolean;
}

const filters = ['Trending', 'Most Viewed', 'Latest', "Editor's Pick"];
const categories = ['All', 'News', 'Hustle', 'Vibes'];
const hashtags = ['#Business', '#Tech', '#Campus', '#Lifestyle', '#AI', '#Startup'];

const ContentGrid = () => {
  const [activeFilter, setActiveFilter] = useState('Trending');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true);
      
      if (error) {
        console.error('Error fetching posts:', error);
        setLoading(false);
        return;
      }

      const mapped: PostDisplay[] = (data as DBPost[]).map(p => ({
        id: p.id,
        title: p.title,
        description: p.description || p.content.slice(0, 120) + '...',
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
      }));

      setPosts(mapped);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  let filtered = [...posts];

  if (activeCategory !== 'All') {
    filtered = filtered.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
  }

  if (activeTag) {
    filtered = filtered.filter(p => p.tags.some(t => `#${t}` === activeTag));
  }

  if (activeFilter === 'Trending') filtered.sort((a, b) => b.engagementScore - a.engagementScore);
  else if (activeFilter === 'Most Viewed') filtered.sort((a, b) => b.views - a.views);
  else if (activeFilter === 'Latest') filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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

      {/* Categories */}
      <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground glow'
                : 'glass glass-hover'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filters */}
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

      {/* Hashtags */}
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

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading posts...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post, i) => (
            <ContentCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No posts found. Create some in the admin dashboard!
        </div>
      )}
    </section>
  );
};

export default ContentGrid;
