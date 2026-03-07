import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink, Clock, RefreshCw } from 'lucide-react';

interface LocalArticle {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  source: string;
}

const fallbackThumb = 'https://images.unsplash.com/photo-1504711434969-e33886168d6c?w=400&h=250&fit=crop';

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const LocalPulse = () => {
  const [articles, setArticles] = useState<LocalArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=Ghana+news'
      );
      const json = await res.json();
      if (json.status === 'ok' && json.items?.length) {
        setArticles(
          json.items.slice(0, 8).map((item: any) => ({
            title: item.title || 'Untitled',
            link: item.link || '#',
            pubDate: item.pubDate || '',
            thumbnail: item.thumbnail || item.enclosure?.link || fallbackThumb,
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

  useEffect(() => { fetchNews(); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass glow rounded-2xl p-6 col-span-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">Local Pulse</h3>
          <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Live
          </span>
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="glass glass-hover rounded-lg p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
              <div className="h-32 bg-muted/20" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted/20 rounded w-3/4" />
                <div className="h-3 bg-muted/20 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="text-center text-muted-foreground text-sm py-8">
          Could not load local news. Please try again.
        </p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {articles.map((a, i) => (
            <motion.a
              key={i}
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass glass-hover rounded-xl overflow-hidden group block"
            >
              <div className="relative h-32 overflow-hidden">
                <img
                  src={a.thumbnail}
                  alt={a.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = fallbackThumb; }}
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(var(--background) / 0.85), transparent 60%)' }} />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  {a.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate max-w-[60%]">{a.source}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3" /> {timeAgo(a.pubDate)}
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default LocalPulse;
