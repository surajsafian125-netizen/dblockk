import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink, Clock, RefreshCw, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Thermometer } from 'lucide-react';

interface LocalArticle {
  title: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  source: string;
}

interface WeatherData {
  temperature: number;
  condition: string;
  weatherCode: number;
}

interface LocalPulseProps {
  cityQuery?: string;
  countryQuery?: string;
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

// WMO weather codes → condition category
const getWeatherCondition = (code: number): { condition: string; gradient: string; icon: typeof Sun } => {
  if (code <= 1) return {
    condition: 'Clear',
    gradient: 'linear-gradient(135deg, hsl(35 90% 55% / 0.25), hsl(45 95% 60% / 0.15), transparent 70%)',
    icon: Sun,
  };
  if (code <= 3) return {
    condition: 'Cloudy',
    gradient: 'linear-gradient(135deg, hsl(215 20% 40% / 0.3), hsl(220 15% 30% / 0.2), transparent 70%)',
    icon: Cloud,
  };
  if (code <= 49) return {
    condition: 'Foggy',
    gradient: 'linear-gradient(135deg, hsl(210 10% 50% / 0.25), hsl(200 15% 40% / 0.15), transparent 70%)',
    icon: Wind,
  };
  if (code <= 69) return {
    condition: 'Rain',
    gradient: 'linear-gradient(135deg, hsl(210 50% 30% / 0.35), hsl(220 40% 25% / 0.25), transparent 70%)',
    icon: CloudRain,
  };
  if (code <= 79) return {
    condition: 'Snow',
    gradient: 'linear-gradient(135deg, hsl(200 30% 70% / 0.3), hsl(210 20% 60% / 0.2), transparent 70%)',
    icon: CloudSnow,
  };
  if (code <= 99) return {
    condition: 'Storm',
    gradient: 'linear-gradient(135deg, hsl(260 40% 20% / 0.4), hsl(270 35% 15% / 0.3), transparent 70%)',
    icon: CloudLightning,
  };
  return {
    condition: 'Clear',
    gradient: 'linear-gradient(135deg, hsl(35 90% 55% / 0.2), transparent 70%)',
    icon: Sun,
  };
};

const LocalPulse = ({ cityQuery, countryQuery }: LocalPulseProps) => {
  const [articles, setArticles] = useState<LocalArticle[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const query = cityQuery ? `${cityQuery}+news` : 'Ghana+news';
  const label = cityQuery
    ? `${cityQuery}${countryQuery ? `, ${countryQuery}` : ''}`
    : 'Ghana';

  const fetchWeather = async () => {
    try {
      // Default: Accra, Ghana (5.6037, -0.1870)
      const lat = 5.6037;
      const lon = -0.187;
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      const json = await res.json();
      if (json.current_weather) {
        setWeather({
          temperature: json.current_weather.temperature,
          condition: getWeatherCondition(json.current_weather.weathercode).condition,
          weatherCode: json.current_weather.weathercode,
        });
      }
    } catch {
      // Silent fail — weather is optional enhancement
    }
  };

  const fetchNews = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=${encodeURIComponent(query)}`
      );
      const json = await res.json();
      if (json.status === 'ok' && json.items?.length) {
        const extractImg = (item: any): string => {
          if (item.thumbnail && item.thumbnail.startsWith('http')) return item.thumbnail;
          if (item.enclosure?.link?.startsWith('http')) return item.enclosure.link;
          const desc = item.description || item.content || '';
          const m = desc.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (m) return m[1];
          return `https://source.unsplash.com/400x250/?${encodeURIComponent(cityQuery || 'city')},news&sig=${encodeURIComponent(item.title || '').slice(0, 20)}`;
        };
        setArticles(
          json.items.slice(0, 8).map((item: any) => ({
            title: item.title || 'Untitled',
            link: item.link || '#',
            pubDate: item.pubDate || '',
            thumbnail: extractImg(item),
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
    fetchNews();
    fetchWeather();
  }, [query]);

  const weatherInfo = weather ? getWeatherCondition(weather.weatherCode) : null;
  const WeatherIcon = weatherInfo?.icon || Sun;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass glow rounded-2xl p-6 col-span-full relative overflow-hidden"
    >
      {/* Dynamic weather background overlay */}
      {weatherInfo && (
        <div
          className="absolute inset-0 rounded-2xl transition-all duration-1000 pointer-events-none"
          style={{ background: weatherInfo.gradient }}
        />
      )}

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <MapPin className="h-5 w-5 text-primary shrink-0" />
          <h3 className="font-display font-semibold text-lg">Local Pulse</h3>
          <span className="text-xs text-muted-foreground">— {label}</span>
          <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium flex items-center gap-1 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Live
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Weather badge */}
          {weather && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="hidden sm:flex items-center gap-2 glass rounded-xl px-3 py-1.5 border border-border/30"
            >
              <WeatherIcon className="h-4 w-4 text-primary" />
              <div className="flex items-center gap-1.5">
                <Thermometer className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-bold font-mono">{weather.temperature}°C</span>
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {weather.condition}
              </span>
            </motion.div>
          )}

          <button
            onClick={() => { fetchNews(); fetchWeather(); }}
            disabled={loading}
            className="glass glass-hover rounded-lg p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
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
      </div>
    </motion.div>
  );
};

export default LocalPulse;
