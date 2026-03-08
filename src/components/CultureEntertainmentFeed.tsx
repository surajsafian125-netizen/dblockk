import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Eye, Clock, ExternalLink, X, RefreshCw,
  Sparkles, Share2, Bookmark,
} from 'lucide-react';

/* ── Types ────────────────────────────────────────────── */
interface FeedItem {
  title: string;
  description: string;
  content: string;
  link: string;
  thumbnail: string;
  pubDate: string;
  source: string;
}

/* ── Helpers ──────────────────────────────────────────── */
const ADMIN_NAME = "D'Block Admin";
const ADMIN_AVATAR = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=dblock&backgroundColor=0891b2';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=450&fit=crop';
const FEED_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=entertainment+culture+trending';

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const stripHtml = (html: string) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const fakeStat = (seed: number) => ({
  views: Math.floor(800 + ((seed * 1337) % 4200)),
  likes: Math.floor(12 + ((seed * 997) % 280)),
  comments: Math.floor(2 + ((seed * 431) % 45)),
  readTime: Math.floor(2 + ((seed * 53) % 7)),
});

/* ── Detail Modal ─────────────────────────────────────── */
const CultureDetailModal = ({
  item,
  onClose,
}: {
  item: FeedItem | null;
  onClose: () => void;
}) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!item) return null;

  const stats = fakeStat(item.title.length);
  const bodyText = stripHtml(item.content || item.description || '');

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-primary/10 bg-card/60 backdrop-blur-xl shadow-[0_0_60px_-10px_hsl(var(--primary)/0.15)]"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 rounded-full p-2 glass glass-hover text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Cover image */}
            <div className="relative h-56 sm:h-72 overflow-hidden rounded-t-2xl">
              <img
                src={item.thumbnail || FALLBACK_IMG}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, hsl(var(--card) / 0.95), transparent 60%)' }}
              />
            </div>

            {/* Content */}
            <div className="p-6 -mt-12 relative">
              {/* Admin author header */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={ADMIN_AVATAR}
                  alt={ADMIN_NAME}
                  className="h-10 w-10 rounded-full border-2 border-primary/30 bg-muted"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-semibold">{ADMIN_NAME}</span>
                    <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium">Admin</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(item.pubDate)}</span>
                </div>
              </div>

              {/* Category tag */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-xs bg-accent/10 text-accent rounded-full px-2 py-0.5">#culture</span>
                <span className="text-xs bg-primary/5 text-primary/70 rounded-full px-2 py-0.5">#entertainment</span>
                <span className="text-xs bg-primary/5 text-primary/70 rounded-full px-2 py-0.5">#trending</span>
              </div>

              <h2 className="font-display text-2xl font-bold mb-4 leading-tight">{item.title}</h2>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {stats.views.toLocaleString()} views</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {stats.readTime}m read</span>
              </div>

              {/* Body text */}
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mb-6">
                {bodyText || 'No additional content available for this article. Click the source link below to read the full story.'}
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/40">
                <motion.button
                  whileTap={{ scale: 1.15 }}
                  onClick={() => setLiked(!liked)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    liked ? 'bg-primary/15 text-primary' : 'glass glass-hover text-muted-foreground'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                  {liked ? stats.likes + 1 : stats.likes}
                </motion.button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm glass glass-hover text-muted-foreground">
                  <MessageCircle className="h-4 w-4" /> {stats.comments}
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm glass glass-hover text-muted-foreground">
                  <Share2 className="h-4 w-4" />
                </button>
                <motion.button
                  whileTap={{ scale: 1.15 }}
                  onClick={() => setSaved(!saved)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ml-auto ${
                    saved ? 'bg-accent/15 text-accent' : 'glass glass-hover text-muted-foreground'
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                </motion.button>
              </div>

              {/* Source link */}
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-primary hover:underline transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Read full article at source
              </a>

              {item.source && (
                <p className="text-center text-[11px] text-muted-foreground mt-2">
                  via {item.source}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ── Feed Card ────────────────────────────────────────── */
const CultureCard = ({
  item,
  index,
  onClick,
}: {
  item: FeedItem;
  index: number;
  onClick: () => void;
}) => {
  const [liked, setLiked] = useState(false);
  const stats = fakeStat(item.title.length);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="glass glass-hover rounded-2xl overflow-hidden group cursor-pointer transition-all"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.thumbnail || FALLBACK_IMG}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(var(--background) / 0.8), transparent)' }} />
        <div className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm bg-accent/15 text-accent">
          Culture
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Author row */}
        <div className="flex items-center gap-2 mb-3">
          <img
            src={ADMIN_AVATAR}
            alt={ADMIN_NAME}
            className="h-6 w-6 rounded-full border border-primary/20 bg-muted"
          />
          <span className="text-xs font-medium">{ADMIN_NAME}</span>
          <span className="text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-medium">Admin</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(item.pubDate)}</span>
        </div>

        <h3 className="font-display font-semibold text-base mb-2 line-clamp-2 leading-snug">{item.title}</h3>
        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
          {stripHtml(item.description || item.content || '')}
        </p>
        <span className="text-xs text-primary font-medium mb-3 inline-block">Read more →</span>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs text-primary/70 bg-primary/5 rounded-full px-2 py-0.5">#culture</span>
          <span className="text-xs text-primary/70 bg-primary/5 rounded-full px-2 py-0.5">#trending</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {stats.views.toLocaleString()}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {stats.readTime}m</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {stats.comments}</span>
            <motion.button
              whileTap={{ scale: 1.3 }}
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${liked ? 'text-destructive' : ''}`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
              {liked ? stats.likes + 1 : stats.likes}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Main Feed Component ──────────────────────────────── */
const CultureEntertainmentFeed = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);

  const fetchFeed = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(FEED_URL);
      const json = await res.json();
      if (json.status === 'ok' && json.items?.length) {
        setItems(
          json.items.slice(0, 9).map((item: any) => ({
            title: item.title || 'Untitled',
            description: item.description || '',
            content: item.content || item.description || '',
            link: item.link || '#',
            thumbnail: item.thumbnail || item.enclosure?.link || '',
            pubDate: item.pubDate || new Date().toISOString(),
            source: item.author || 'Google News',
          }))
        );
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFeed(); }, []);

  return (
    <>
      <section className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3"
          >
            <Sparkles className="h-6 w-6 text-accent" />
            <h2 className="font-display text-3xl font-bold">
              Culture & Entertainment <span className="text-accent">Feed</span>
            </h2>
            <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Live
            </span>
          </motion.div>
          <button
            onClick={fetchFeed}
            disabled={loading}
            className="glass glass-hover rounded-lg p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-muted/20" />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted/20" />
                    <div className="h-3 bg-muted/20 rounded w-24" />
                  </div>
                  <div className="h-4 bg-muted/20 rounded w-3/4" />
                  <div className="h-3 bg-muted/20 rounded w-full" />
                  <div className="h-3 bg-muted/20 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="glass glow rounded-2xl p-8 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Could not load the culture feed. Please try again.</p>
          </div>
        )}

        {/* Cards Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, i) => (
              <CultureCard
                key={item.link + i}
                item={item}
                index={i}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Detail Modal */}
      <CultureDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
};

export default CultureEntertainmentFeed;
