import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Heart, Clock, TrendingUp, MessageCircle, Send, Bookmark, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sharePost } from '@/lib/shareUtils';
import type { PostDisplay } from './ContentGrid';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

const PostDetailModal = ({
  post,
  onClose,
  isBookmarked,
  onToggleBookmark,
}: {
  post: PostDisplay | null;
  onClose: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (postId: string) => void;
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    if (!post) return;
    setLikes(post.likes);
    setLiked(false);

    if (user) {
      supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setLiked(true);
        });
    }

    const fetchComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      if (data) setComments(data);
    };
    fetchComments();
  }, [post, user]);

  const handleLike = async () => {
    if (!user || !post) return;
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      setLiked(false);
      setLikes(prev => Math.max(0, prev - 1));
      await supabase.from('posts').update({ likes_count: Math.max(0, likes - 1) }).eq('id', post.id);
    } else {
      const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
      if (!error) {
        setLiked(true);
        setLikes(prev => prev + 1);
        await supabase.from('posts').update({ likes_count: likes + 1 }).eq('id', post.id);
      }
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || !user || !post) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: user.id, content: newComment.trim() })
      .select()
      .single();
    if (!error && data) {
      setComments(prev => [...prev, data]);
      setNewComment('');
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {post && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-primary/10 bg-card/60 backdrop-blur-xl shadow-[0_0_60px_-10px_hsl(var(--primary)/0.15)]"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 rounded-full p-2 glass glass-hover text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative h-56 sm:h-64 overflow-hidden rounded-t-2xl">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(var(--card) / 0.9), transparent 60%)' }} />
            </div>

            <div className="p-6 -mt-10 relative">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.map(tag => (
                  <span key={tag} className="text-xs text-primary/70 bg-primary/5 rounded-full px-2 py-0.5">#{tag}</span>
                ))}
              </div>

              <h2 className="font-display text-2xl font-bold mb-3">{post.title}</h2>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views.toLocaleString()} views</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readingTime}m read</span>
                <span className="flex items-center gap-1 text-primary"><TrendingUp className="h-3 w-3" /> {post.engagementScore}%</span>
              </div>

              <div className="mb-6 prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-img:rounded-xl prose-img:shadow-lg prose-img:w-full">
                <ReactMarkdown
                  components={{
                    img: ({ alt, ...props }) => (
                      <img
                        {...props}
                        alt={alt || post.title}
                        loading="lazy"
                        className="w-full rounded-xl object-cover shadow-lg"
                      />
                    ),
                  }}
                >
                  {post.content || post.description}
                </ReactMarkdown>
              </div>

              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/40">
                <motion.button
                  whileTap={{ scale: 1.2 }}
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    liked ? 'bg-primary/15 text-primary' : 'glass glass-hover text-muted-foreground'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                  {likes} {likes === 1 ? 'Like' : 'Likes'}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 1.2 }}
                  onClick={() => onToggleBookmark?.(post.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isBookmarked ? 'bg-primary/15 text-primary' : 'glass glass-hover text-muted-foreground'
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  {isBookmarked ? 'Stashed' : 'Stash'}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 1.2 }}
                  onClick={() => sharePost(post.title, post.description, post.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium glass glass-hover text-muted-foreground transition-all"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </motion.button>

                <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <MessageCircle className="h-3.5 w-3.5" /> {comments.length} comments
                </span>
              </div>

              <div className="space-y-3 mb-4">
                {comments.map(c => (
                  <div key={c.id} className="glass rounded-xl p-3 text-sm">
                    <p className="text-foreground">{c.content}</p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {new Date(c.created_at!).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>

              {user && (
                <div className="flex gap-2">
                  <input
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                    placeholder="Add a comment…"
                    className="flex-1 rounded-xl glass px-4 py-2.5 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleComment}
                    disabled={submitting || !newComment.trim()}
                    className="rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium disabled:opacity-40 transition-opacity"
                  >
                    <Send className="h-4 w-4" />
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostDetailModal;
