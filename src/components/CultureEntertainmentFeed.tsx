import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Eye, Clock, ExternalLink, X, RefreshCw,
  Sparkles, Share2, Bookmark,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

/* ── Detail Modal ─────────────────────────────────────── */
const CultureDetailModal = ({
  item,
  onClose,
}: {
  item: FeedItem | null;
  onClose: () => void;
}) => {
  if (!item) return null;

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

            <div className="p-6 -mt-12 relative">
              <div className="flex items-center gap-3 mb-4">
                <img src={ADMIN_AVATAR} alt={ADMIN_NAME} className="h-10 w-10 rounded-full border-2 border-primary/30 bg-muted" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-semibold">{ADMIN_NAME}</span>
                    <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium">Admin</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(item.pubDate)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-xs bg-accent/10 text-accent rounded-full px-2 py-0.5">#culture</span>
                <span className="text-xs bg-primary/5 text-primary/70 rounded-full px-2 py-0.5">#entertainment</span>
              </div>

              <h2 className="font-display text-2xl font-bold mb-4 leading-tight">{item.title}</h2>

              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mb-6">
                {bodyText || 'No additional content available. Click the source link below to read the full story.'}
              </div>

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
                <p className="text-center text-[11px] text-muted-foreground mt-2">via {item.source}</p>
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

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <img src={ADMIN_AVATAR} alt={ADMIN_NAME} className="h-6 w-6 rounded-full border border-primary/20 bg-muted" />
          <span className="text-xs font-medium">{ADMIN_NAME}</span>
          <span className="text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-medium">Admin</span>
          <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(item.pubDate)}</span>
        </div>

        <h3 className="font-display font-semibold text-base mb-2 line-clamp-2 leading-snug">{item.title}</h3>
        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
          {stripHtml(item.description || item.content || '')}
        </p>
        <span className="text-xs text-primary font-medium mb-3 inline-block">Read more →</span>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs text-primary/70 bg-primary/5 rounded-full px-2 py-0.5">#culture</span>
          <span className="text-xs text-primary/70 bg-primary/5 rounded-full px-2 py-0.5">#trending</span>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Main Feed Component ──────────────────────────────── */
const CultureEntertainmentFeed = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [feedEnabled, setFeedEnabled] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Fetch admin feed settings
  useEffect(() => {
    const loadSettings = async () => {
      const { data: enabledRow } = await supabase.from('admin_config').select('value').eq('key', 'feed_enabled').single();
      const { data: urlRow } = await supabase.from('admin_config').select('value').eq('key', 'feed_rss_url').single();
      if (enabledRow) setFeedEnabled(enabledRow.value === 'true');
      if (urlRow && urlRow.value) setFeedUrl(urlRow.value);
      setSettingsLoaded(true);
    };
    loadSettings();
  }, []);

  const fetchFeed = async (url: string) => {
    setLoading(true);
    setError(false);
    try {
      const rssJsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
      const res = await fetch(rssJsonUrl);
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

  useEffect(() => {
    if (!settingsLoaded) return;
    if (feedEnabled && feedUrl) {
      fetchFeed(feedUrl);
    } else {
      // Fallback: use a default feed URL if admin hasn't set one but feed is enabled
      if (feedEnabled) {
        fetchFeed('https://news.google.com/rss/search?q=entertainment+culture+trending');
      } else {
        setLoading(false);
      }
    }
  }, [settingsLoaded, feedEnabled, feedUrl]);

  // If feed is disabled, don't render anything
  if (settingsLoaded && !feedEnabled) return null;

  return (
    <>
      <section className="container mx-auto px-4 py-16">
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
            onClick={() => feedUrl && fetchFeed(feedUrl)}
            disabled={loading}
            className="glass glass-hover rounded-lg p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

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
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="glass glow rounded-2xl p-8 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Could not load the culture feed. Please try again.</p>
          </div>
        )}

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

      <CultureDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </>
  );
};

export default CultureEntertainmentFeed;
