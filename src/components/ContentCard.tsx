import { motion } from 'framer-motion';
import { Eye, Heart, Clock, TrendingUp, Flame } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PostDisplay } from './ContentGrid';

const categoryClass: Record<string, string> = {
  news: 'bg-category-news/10 text-category-news',
  hustle: 'bg-category-hustle/10 text-category-hustle',
  vibes: 'bg-category-vibes/10 text-category-vibes',
};

const ContentCard = ({ post, index, onClick }: { post: PostDisplay; index: number; onClick?: () => void }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [likeLoading, setLikeLoading] = useState(false);

  // Check if user already liked this post
  useEffect(() => {
    if (!user) return;
    supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setLiked(true);
      });
  }, [user, post.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || likeLoading) return;
    setLikeLoading(true);

    if (liked) {
      // Remove like
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      setLiked(false);
      setLikes(prev => Math.max(0, prev - 1));
      // Update post likes_count
      await supabase.from('posts').update({ likes_count: Math.max(0, likes - 1) }).eq('id', post.id);
    } else {
      // Add like
      const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
      if (!error) {
        setLiked(true);
        setLikes(prev => prev + 1);
        await supabase.from('posts').update({ likes_count: likes + 1 }).eq('id', post.id);
      }
    }
    setLikeLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="glass glass-hover rounded-2xl overflow-hidden group cursor-pointer transition-all"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(var(--background) / 0.8), transparent)' }} />
        {post.isTrending && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-category-news/20 text-category-news rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
            <Flame className="h-3 w-3" /> Hot 🔥
          </div>
        )}
        <div className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${categoryClass[post.category.toLowerCase()] || 'glass'}`}>
          {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{post.description}</p>
        <span className="text-xs text-primary font-medium mb-3 inline-block">Read more →</span>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs text-primary/70 bg-primary/5 rounded-full px-2 py-0.5">
              #{tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views.toLocaleString()}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readingTime}m</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-primary text-xs">
              <TrendingUp className="h-3 w-3" /> {post.engagementScore}%
            </div>
            <motion.button
              whileTap={{ scale: 1.3 }}
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${liked ? 'text-category-news' : ''}`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
              {likes}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContentCard;
