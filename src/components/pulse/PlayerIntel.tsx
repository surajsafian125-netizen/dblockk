import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Loader2, Star, Trophy, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ---------- Types (loose, upstream is varied) ----------
interface Team {
  id?: number | string;
  name?: string;
  longName?: string;
  score?: number;
}
interface Match {
  id: string | number;
  leagueName?: string;
  leagueId?: number | string;
  status?: { started?: boolean; finished?: boolean; cancelled?: boolean; ongoing?: boolean; liveTime?: { short?: string; long?: string }; startTimeStr?: string; reason?: { short?: string; long?: string } };
  statusId?: number;
  home?: Team;
  away?: Team;
  time?: string;
  timeTS?: number;
}

// ---------- Helpers ----------
const pickArray = (obj: any, keys: string[]): any[] => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  for (const k of keys) {
    if (Array.isArray(obj?.[k])) return obj[k];
    if (Array.isArray(obj?.response?.[k])) return obj.response[k];
  }
  if (Array.isArray(obj?.response)) return obj.response;
  if (Array.isArray(obj?.data)) return obj.data;
  if (Array.isArray(obj?.response?.matches)) return obj.response.matches;
  return [];
};

const flattenLeagues = (raw: any): Match[] => {
  const arr = pickArray(raw, ['leagues', 'matches', 'data']);
  const out: Match[] = [];
  for (const item of arr) {
    if (item?.matches && Array.isArray(item.matches)) {
      const leagueName = item?.name || item?.ccode || item?.primaryId;
      for (const m of item.matches) out.push({ ...m, leagueName: m.leagueName || leagueName });
    } else if (item?.id && (item?.home || item?.homeTeam)) {
      out.push(item);
    }
  }
  return out;
};

const teamLogo = (id?: number | string) =>
  id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png` : '';

const isLive = (m: Match) => m?.status?.ongoing || m?.status?.started && !m?.status?.finished;

// ---------- Component ----------
const LiveFootballDashboard = () => {
  const [matches, setMatches] = useState<Map<string, Match>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Match | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [recentMatches, setRecentMatches] = useState<Match[]>([]);

  const fetchMatches = async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('football-players', {
        body: { action: 'live' },
      });
      if (fnError) throw fnError;
      const live = flattenLeagues(data?.live);
      const today = flattenLeagues(data?.today);
      const yesterday = flattenLeagues(data?.yesterday);
      const next = new Map<string, Match>();
      for (const m of [...live, ...today]) {
        const id = String(m.id);
        if (!next.has(id)) next.set(id, m);
      }
      setMatches(next);

      // Recent finished (last 24h fallback)
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const recent = [...yesterday, ...today]
        .filter((m) => m?.status?.finished)
        .filter((m) => {
          const ts = (m.timeTS ? m.timeTS * 1000 : 0) || Date.parse((m as any).time || '') || Date.now();
          return ts >= cutoff;
        })
        .sort((a, b) => ((b.timeTS || 0) - (a.timeTS || 0)));
      // Dedupe
      const seen = new Set<string>();
      const dedup: Match[] = [];
      for (const m of recent) {
        const id = String(m.id);
        if (!seen.has(id)) { seen.add(id); dedup.push(m); }
      }
      setRecentMatches(dedup);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchMatches();
    const t = setInterval(fetchMatches, 45_000);
    return () => clearInterval(t);
  }, []);

  const { liveMatches, upcomingMatches } = useMemo(() => {
    const all = Array.from(matches.values());
    return {
      liveMatches: all.filter(isLive),
      upcomingMatches: all.filter((m) => !isLive(m) && !m?.status?.finished).slice(0, 12),
    };
  }, [matches]);

  const openMatch = async (m: Match) => {
    setSelected(m);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { data } = await supabase.functions.invoke('football-players', {
        body: { action: 'match', matchId: String(m.id) },
      });
      setDetail(data);
    } catch (e) {
      // silent
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          ⚽ Live Football
          {liveMatches.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> {liveMatches.length} LIVE
            </span>
          )}
        </h2>
        <button
          onClick={fetchMatches}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <Activity className="w-3 h-3" /> auto-refresh 45s
        </button>
      </div>

      {loading && matches.size === 0 && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading live matches...
        </div>
      )}

      {error && (
        <div className="glass-card p-4 text-sm text-red-400 border border-red-500/30">{error}</div>
      )}

      {/* LIVE */}
      {liveMatches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-red-400 mb-3 font-mono">● Live Now</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveMatches.map((m) => (
              <MatchCard key={`live-${m.id}`} match={m} onClick={() => openMatch(m)} live />
            ))}
          </div>
        </div>
      )}

      {/* UPCOMING */}
      {upcomingMatches.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-mono">Today's Fixtures</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingMatches.map((m) => (
              <MatchCard key={`up-${m.id}`} match={m} onClick={() => openMatch(m)} />
            ))}
          </div>
        </div>
      )}

      {/* RECENT RESULTS — fallback when no live matches */}
      {liveMatches.length === 0 && recentMatches.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-mono">
            Recent Results · Last 24h
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentMatches.slice(0, 12).map((m) => (
              <MatchCard key={`recent-${m.id}`} match={m} onClick={() => openMatch(m)} />
            ))}
          </div>
        </div>
      )}

      {!loading && liveMatches.length === 0 && upcomingMatches.length === 0 && recentMatches.length === 0 && !error && (
        <div className="glass-card p-6 text-center text-sm text-muted-foreground">
          No live, scheduled, or recent matches found.
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 relative"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <MatchDetail match={selected} detail={detail} loading={detailLoading} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------- Card ----------
const MatchCard = ({ match, onClick, live }: { match: Match; onClick: () => void; live?: boolean }) => {
  const home = match.home || (match as any).homeTeam || {};
  const away = match.away || (match as any).awayTeam || {};
  const minute = match.status?.liveTime?.short || match.status?.startTimeStr || (match as any).time || '';
  const homeScore = home.score ?? (match as any).homeScore;
  const awayScore = away.score ?? (match as any).awayScore;

  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="glass-card p-4 text-left w-full hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
          {match.leagueName || 'Football'}
        </span>
        {live ? (
          <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> {minute || 'LIVE'}
          </span>
        ) : (
          <span className="text-[10px] font-mono text-muted-foreground">{minute}</span>
        )}
      </div>
      <Row team={home} score={homeScore} live={live} />
      <Row team={away} score={awayScore} live={live} />
    </motion.button>
  );
};

const Row = ({ team, score, live }: { team: any; score?: number; live?: boolean }) => (
  <div className="flex items-center justify-between py-1">
    <div className="flex items-center gap-2 min-w-0">
      <img
        src={teamLogo(team?.id)}
        alt=""
        className="w-5 h-5 object-contain"
        onError={(e) => ((e.currentTarget.style.visibility = 'hidden'))}
      />
      <span className="text-sm truncate">{team?.name || team?.longName || '—'}</span>
    </div>
    <span className={`text-sm font-bold tabular-nums ${live ? 'text-red-400' : ''}`}>
      {score ?? '-'}
    </span>
  </div>
);

// ---------- Detail ----------
const MatchDetail = ({ match, detail, loading }: { match: Match; detail: any; loading: boolean }) => {
  const stats = detail?.stats?.response || detail?.stats;
  const playersData = detail?.players?.response || detail?.players;
  const home = match.home || {};
  const away = match.away || {};
  const minute = match.status?.liveTime?.short || match.status?.startTimeStr || '';

  // Try to extract stats array
  const statItems = (() => {
    const list = stats?.statistics || stats?.stats || [];
    if (Array.isArray(list) && list.length > 0) {
      const flat: { name: string; home: any; away: any }[] = [];
      for (const grp of list) {
        const items = grp?.stats || grp?.items || (Array.isArray(grp) ? grp : []);
        if (Array.isArray(items)) {
          for (const it of items) {
            if (it?.title && (it?.stats || it?.values)) {
              const vals = it.stats || it.values;
              flat.push({ name: it.title, home: vals?.[0], away: vals?.[1] });
            }
          }
        }
      }
      return flat;
    }
    return [];
  })();

  const topPlayers = (() => {
    const list = playersData?.topRatedPlayers || playersData?.players || playersData || [];
    return Array.isArray(list) ? list.slice(0, 6) : [];
  })();

  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        {match.leagueName || 'Football'} {minute && `· ${minute}`}
      </div>
      <div className="grid grid-cols-3 items-center gap-3 mb-6">
        <div className="text-center">
          <img src={teamLogo(home.id)} alt="" className="w-12 h-12 object-contain mx-auto mb-2" />
          <div className="text-sm font-semibold">{home.name}</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold tabular-nums">
            {home.score ?? '-'} : {away.score ?? '-'}
          </div>
        </div>
        <div className="text-center">
          <img src={teamLogo(away.id)} alt="" className="w-12 h-12 object-contain mx-auto mb-2" />
          <div className="text-sm font-semibold">{away.name}</div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading match details...
        </div>
      )}

      {!loading && statItems.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Match Stats
          </h4>
          <div className="space-y-2">
            {statItems.slice(0, 8).map((s, i) => (
              <div key={i} className="grid grid-cols-3 text-xs gap-2 items-center">
                <span className="text-right tabular-nums">{String(s.home ?? '-')}</span>
                <span className="text-center text-muted-foreground">{s.name}</span>
                <span className="text-left tabular-nums">{String(s.away ?? '-')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && topPlayers.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
            <Star className="w-3 h-3" /> Top Rated Players
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topPlayers.map((p: any, i: number) => (
              <div key={i} className="glass-card p-2 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p?.name || p?.playerName || '—'}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {p?.teamName || p?.team || ''}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold tabular-nums">
                  <Trophy className="w-3 h-3" /> {p?.rating ?? p?.ratingNum ?? '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && statItems.length === 0 && topPlayers.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Detailed stats will appear once the match starts.
        </div>
      )}
    </div>
  );
};

export default LiveFootballDashboard;
