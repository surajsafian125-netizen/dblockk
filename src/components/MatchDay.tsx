import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Play, Clock, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

/* ── Types ─────────────────────────────────────────────── */

interface MatchEvent {
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD';
  minute: string;
  team: string;
  player: string;
  detail: string | null;
}

interface Fixture {
  id?: number;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute: string | null;
  utcDate: string;
  competition: string;
  events?: MatchEvent[];
}

interface Highlight {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  videoUrl: string;
}

/* ── Fallback data ─────────────────────────────────────── */

const FALLBACK_FIXTURES: Fixture[] = [
  { home: 'Real Madrid', away: 'Man City', homeScore: 2, awayScore: 1, status: 'IN_PLAY', minute: "78'", utcDate: '', competition: 'Champions League', events: [
    { type: 'GOAL', minute: '23', team: 'Real Madrid', player: 'Vinícius Jr', detail: null },
    { type: 'YELLOW_CARD', minute: '34', team: 'Man City', player: 'Rodri', detail: null },
    { type: 'GOAL', minute: '52', team: 'Man City', player: 'Haaland', detail: null },
    { type: 'GOAL', minute: '71', team: 'Real Madrid', player: 'Bellingham', detail: null },
  ]},
  { home: 'Bayern Munich', away: 'PSG', homeScore: 0, awayScore: 0, status: 'SCHEDULED', minute: '20:45', utcDate: '', competition: 'Champions League', events: [] },
  { home: 'Barcelona', away: 'Inter Milan', homeScore: 3, awayScore: 2, status: 'FINISHED', minute: 'FT', utcDate: '', competition: 'Champions League', events: [
    { type: 'GOAL', minute: '11', team: 'Barcelona', player: 'Raphinha', detail: null },
    { type: 'GOAL', minute: '29', team: 'Inter Milan', player: 'Lautaro', detail: null },
    { type: 'RED_CARD', minute: '44', team: 'Inter Milan', player: 'Barella', detail: null },
    { type: 'GOAL', minute: '56', team: 'Barcelona', player: 'Lewandowski', detail: 'Penalty' },
    { type: 'GOAL', minute: '67', team: 'Inter Milan', player: 'Thuram', detail: null },
    { type: 'GOAL', minute: '82', team: 'Barcelona', player: 'Yamal', detail: null },
  ]},
];

const MOCK_HIGHLIGHTS: Highlight[] = [
  { id: '1', title: 'Real Madrid vs Man City | UCL QF Highlights', thumbnail: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=400&h=225&fit=crop', channelTitle: 'UEFA', publishedAt: new Date().toISOString(), videoUrl: '#' },
  { id: '2', title: 'Barcelona 3-2 Inter Milan | All Goals', thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=225&fit=crop', channelTitle: 'UEFA', publishedAt: new Date().toISOString(), videoUrl: '#' },
];

/* ── Helpers ────────────────────────────────────────────── */

const statusLabel = (f: Fixture) => {
  if (['IN_PLAY', 'LIVE', 'PAUSED'].includes(f.status))
    return `● LIVE ${f.minute || ''}`;
  if (f.status === 'FINISHED') return 'Full Time';
  if (f.utcDate) {
    try { return new Date(f.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { /* fall through */ }
  }
  return f.minute || 'TBD';
};

const statusClass = (status: string) => {
  if (['IN_PLAY', 'LIVE', 'PAUSED'].includes(status))
    return 'border-red-500/50 text-red-400 animate-pulse';
  if (status === 'FINISHED')
    return 'border-muted-foreground/30 text-muted-foreground';
  return 'border-primary/30 text-primary/80';
};

const eventIcon = (type: string) => {
  switch (type) {
    case 'GOAL': return '⚽';
    case 'YELLOW_CARD': return '🟨';
    case 'RED_CARD': return '🟥';
    default: return '•';
  }
};

const isLiveStatus = (status: string) => ['IN_PLAY', 'LIVE', 'PAUSED'].includes(status);

const timeAgo = (dateStr: string) => {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch { return ''; }
};
/* ── Component ─────────────────────────────────────────── */

const MatchDay = () => {
  const [activeTab, setActiveTab] = useState<'play-by-play' | 'highlights'>('play-by-play');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>(MOCK_HIGHLIGHTS);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [highlightsFetched, setHighlightsFetched] = useState(false);

  const hasLiveMatch = fixtures.some(f => isLiveStatus(f.status));

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('football-scores');
        if (error) throw error;
        const matches: Fixture[] = data?.matches ?? [];
        setFixtures(matches.slice(0, 5));
        setIsLive(matches.length > 0);
      } catch {
        setFixtures([]);
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
    // Auto-refresh every 60s so the panel reflects current matches
    const iv = setInterval(fetchScores, 60_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (activeTab !== 'highlights' || highlightsFetched) return;
    const fetchHighlights = async () => {
      setHighlightsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('youtube-highlights');
        if (error) throw error;
        const items: Highlight[] = data?.highlights ?? [];
        if (items.length > 0) setHighlights(items);
      } catch (err) {
        console.error('Failed to fetch highlights:', err);
      } finally {
        setHighlightsLoading(false);
        setHighlightsFetched(true);
      }
    };
    fetchHighlights();
  }, [activeTab, highlightsFetched]);

  const tabs = [
    { key: 'play-by-play' as const, label: 'Live Play-by-Play', icon: Zap },
    { key: 'highlights' as const, label: 'Highlights', icon: Play },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass glow rounded-2xl p-6 h-full relative"
    >
      {/* Live indicator — shows when play-by-play is active AND there's live data */}
      {activeTab === 'play-by-play' && (isLive || hasLiveMatch) && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.4)]" />
          </span>
          <span className="text-[10px] font-medium text-green-400 uppercase tracking-wider">Live</span>
        </div>
      )}

      {/* Header */}
      <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        Sports <span className="text-primary text-glow">Intelligence</span>
      </h3>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-background/30 border border-border/20 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-primary/20 text-primary shadow-[0_0_12px_rgba(var(--primary-rgb,139,92,246),0.15)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'play-by-play' ? (
          <motion.div
            key="play-by-play"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm animate-pulse">
                Fetching live scores…
              </div>
            ) : fixtures.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm text-center px-4">
                No recent fixtures from the top leagues right now. Scores refresh automatically.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {fixtures.map((f, i) => (
                  <motion.div
                    key={f.id ?? i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-xl bg-background/30 border border-border/30 overflow-hidden cursor-pointer hover:border-primary/20 transition-colors"
                    onClick={() => setExpandedMatch(expandedMatch === i ? null : i)}
                  >
                    {/* Score row */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={`text-[10px] px-2 py-0 ${statusClass(f.status)}`}>
                          {statusLabel(f)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{f.competition}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex-1 truncate">{f.home}</span>
                        <div className="flex items-center gap-2 px-3">
                          <span className="font-display text-lg font-bold">{f.homeScore}</span>
                          <span className="text-muted-foreground text-xs">-</span>
                          <span className="font-display text-lg font-bold">{f.awayScore}</span>
                        </div>
                        <span className="text-sm font-medium flex-1 text-right truncate">{f.away}</span>
                      </div>
                    </div>

                    {/* Expandable events timeline */}
                    <AnimatePresence>
                      {expandedMatch === i && f.events && f.events.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-border/20"
                        >
                          <div className="p-3 space-y-1.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Match Events</span>
                            {f.events.map((ev, j) => (
                              <div key={j} className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground font-mono w-6 text-right shrink-0">{ev.minute}'</span>
                                <span className="shrink-0">{eventIcon(ev.type)}</span>
                                <span className="font-medium truncate">{ev.player}</span>
                                {ev.detail && (
                                  <span className="text-muted-foreground">({ev.detail})</span>
                                )}
                                <span className="text-muted-foreground/60 ml-auto text-[10px] shrink-0">{ev.team}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Expand hint */}
                    {f.events && f.events.length > 0 && (
                      <div className="flex justify-center pb-1">
                        <Circle className={`h-1.5 w-1.5 text-muted-foreground/40 transition-transform ${expandedMatch === i ? 'rotate-180' : ''}`} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="highlights"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {highlightsLoading ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm animate-pulse">
                Loading highlights…
              </div>
            ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              {highlights.map((h, i) => (
                <motion.a
                  key={h.id}
                  href={h.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-3 p-2 rounded-xl bg-background/30 border border-border/30 hover:border-primary/20 transition-colors cursor-pointer group"
                >
                  {/* Thumbnail */}
                  <div className="relative shrink-0 w-28 h-16 rounded-lg overflow-hidden">
                    <img
                      src={h.thumbnail}
                      alt={h.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-5 w-5 text-white fill-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-xs font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {h.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-primary/70">{h.channelTitle}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {timeAgo(h.publishedAt)}
                      </span>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MatchDay;
