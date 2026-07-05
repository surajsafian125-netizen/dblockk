import { motion } from 'framer-motion';
import { Eye, Clock, TrendingUp, Flame, Bookmark, ShieldCheck } from 'lucide-react';
import ReactionsBar from './ReactionsBar';
import ShareMenu from './ShareMenu';
import type { PostDisplay } from './ContentGrid';

const timeAgo = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

const categoryClass: Record<string, string> = {
  news: 'bg-category-news/10 text-category-news',
  hustle: 'bg-category-hustle/10 text-category-hustle',
  vibes: 'bg-category-vibes/10 text-category-vibes',
};

const ContentCard = ({
  post,
  index,
  onClick,
  isBookmarked,
  onToggleBookmark,
}: {
  post: PostDisplay;
  index: number;
  onClick?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (postId: string) => void;
}) => {
  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark?.(post.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index, 6) * 0.06, duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="glass glass-hover rounded-2xl overflow-hidden group cursor-pointer transition-all"
    >
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, hsl(var(--background) / 0.85), transparent 70%)',
          }}
        />
        {post.isTrending && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-category-news/20 text-category-news rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
            <Flame className="h-3 w-3" /> Hot
          </div>
        )}
        <div
          className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm ${
            categoryClass[post.category.toLowerCase()] || 'glass'
          }`}
        >
          {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
            DB
          </div>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-primary" /> D'Block Editorial
          </span>
        </div>

        <h3 className="font-display font-semibold text-base sm:text-lg mb-1.5 line-clamp-2 leading-snug">
          {post.title}
        </h3>
        <p className="text-muted-foreground text-xs sm:text-sm mb-2 line-clamp-2">
          {post.description}
        </p>
        <span className="text-[11px] text-primary font-medium mb-2 inline-block">
          Read more →
        </span>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-[10px] text-primary/70 bg-primary/5 rounded-full px-2 py-0.5"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <ReactionsBar postId={post.id} className="mb-3" />

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> {post.views.toLocaleString()}
            </span>
            <span
              className="flex items-center gap-1"
              title={new Date(post.createdAt).toLocaleString()}
            >
              <Clock className="h-3 w-3" /> {timeAgo(post.createdAt)}
            </span>
            <span className="flex items-center gap-1 text-primary">
              <TrendingUp className="h-3 w-3" /> {post.engagementScore}%
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <motion.button
              whileTap={{ scale: 1.2 }}
              onClick={handleBookmark}
              className={`transition-colors ${
                isBookmarked ? 'text-primary' : 'hover:text-primary'
              }`}
              title={isBookmarked ? 'Remove from Stash' : 'Save to Stash'}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            </motion.button>
            <ShareMenu title={post.title} description={post.description} postId={post.id} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContentCard;
