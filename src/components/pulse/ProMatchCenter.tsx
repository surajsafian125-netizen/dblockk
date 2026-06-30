import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Loader2, Star, Trophy, X, Radio, Calendar, Target, Crosshair, Flag, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ---------- Top 5 European leagues (FotMob IDs) ----------
const TOP5_IDS = new Set<number | string>([47, 87, 54, 55, 53]);
const TOP5_NAMES = ['Premier League', 'LaLiga', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1'];

// ---------- Types ----------
interface Team { id?: number | string; name?: string; longName?: string; score?: number }
interface Match {
  id: string | number;
  leagueName?: string;
  leagueId?: number | string;
  status?: { started?: boolean; finished?: boolean; cancelled?: boolean; ongoing?: boolean; liveTime?: { short?: string; long?: string }; startTimeStr?: string };
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
      const leagueId = item?.id || item?.primaryId;
      for (const m of item.matches) out.push({ ...m, leagueName: m.leagueName || leagueName, leagueId: m.leagueId || leagueId });
    } else if (item?.id && (item?.home || item?.homeTeam)) {
      out.push(item);
    }
  }
  return out;
};

const teamLogo = (id?: number | string) =>
  id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png` : '';

const isLive = (m: Match) => !!(m?.status?.ongoing || (m?.status?.started && !m?.status?.finished));
const isTop5 = (m: Match) =>
  (m.leagueId !== undefined && TOP5_IDS.has(m.leagueId as any)) ||
  TOP5_NAMES.some((n) => (m.leagueName || '').toLowerCase().includes(n.toLowerCase()));

// ---------- Skeleton ----------
const CardSkeleton = () => (
  <div className="glass-card p-5 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-3 w-20 bg-muted/40 rounded" />
      <div className="h-3 w-10 bg-muted/40 rounded" />
    </div>
    {[0, 1].map((i) => (
      <div key={i} className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted/40" />
          <div className="h-3 w-24 bg-muted/40 rounded" />
        </div>
        <div className="h-4 w-5 bg-muted/40 rounded" />
      </div>
    ))}
  </div>
);

// ---------- Component ----------
const ProMatchCenter = () => {
  const [matchMap, setMatchMap] = useState<Map<string, Match>>(new Map());
  const [recent, setRecent] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Match | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'top5' | 'live'>('top5');

  const fetchAll = async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('football-players', {
        body: { action: 'live' },
      });
      if (fnError) throw fnError;

      const live = flattenLeagues(data?.live);
      const today = flattenLeagues(data?.today);
      const yesterday = flattenLeagues(data?.yesterday);

      // upsert by id to prevent duplicates
      const next = new Map<string, Match>();
      for (const m of [...live, ...today]) {
        const id = String(m.id);
        if (!next.has(id)) next.set(id, m);
      }
      setMatchMap(next);

      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const r = [...yesterday, ...today]
        .filter((m) => m?.status?.finished)
        .filter((m) => {
          const ts = (m.timeTS ? m.timeTS * 1000 : 0) || Date.parse((m as any).time || '') || Date.now();
          return ts >= cutoff;
        })
        .sort((a, b) => (b.timeTS || 0) - (a.timeTS || 0));
      const seen = new Set<string>();
      const dedup: Match[] = [];
      for (const m of r) {
        const id = String(m.id);
        if (!seen.has(id)) { seen.add(id); dedup.push(m); }
      }
      setRecent(dedup);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 45_000);
    return () => clearInterval(t);
  }, []);

  const { liveMatches, upcomingMatches, recentMatches } = useMemo(() => {
    const all = Array.from(matchMap.values());
    const apply = (arr: Match[]) =>
      filter === 'top5' ? arr.filter(isTop5) : filter === 'live' ? arr.filter(isLive) : arr;
    const live = apply(all.filter(isLive));
    const upcoming = apply(all.filter((m) => !isLive(m) && !m?.status?.finished));
    const finished = filter === 'top5' ? recent.filter(isTop5) : recent;

    // If top5 filter wipes everything, fall back to all so the screen is never empty
    if (filter === 'top5' && live.length === 0 && upcoming.length === 0 && finished.length === 0) {
      return {
        liveMatches: all.filter(isLive),
        upcomingMatches: all.filter((m) => !isLive(m) && !m?.status?.finished).slice(0, 12),
        recentMatches: recent,
      };
    }
    return { liveMatches: live, upcomingMatches: upcoming.slice(0, 12), recentMatches: finished };
  }, [matchMap, recent, filter]);

  const openMatch = async (m: Match) => {
    setSelected(m);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { data } = await supabase.functions.invoke('football-players', {
        body: { action: 'match', matchId: String(m.id) },
      });
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  };

  const FilterBtn = ({ k, label, icon }: { k: typeof filter; label: string; icon?: React.ReactNode }) => (
    <button
      onClick={() => setFilter(k)}
      className={`text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
        filter === k
          ? 'bg-primary/20 text-primary border-primary/40'
          : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
      }`}
    >
      {icon}{label}
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <span className="text-primary">⚽</span> Pro Match Center
            {liveMatches.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> {liveMatches.length} LIVE
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Top 5 European leagues · Live global matches · Auto-refresh 45s</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterBtn k="top5" label="Top 5" icon={<Trophy className="w-3 h-3" />} />
          <FilterBtn k="live" label="Live" icon={<Radio className="w-3 h-3" />} />
          <FilterBtn k="all" label="All" icon={<Calendar className="w-3 h-3" />} />
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && matchMap.size === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {error && !loading && (
        <div className="glass-card p-4 text-sm text-red-400 border border-red-500/30">{error}</div>
      )}

      {/* LIVE */}
      {liveMatches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-red-400 mb-3 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Live Now
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveMatches.map((m) => (
              <MatchCard key={`live-${m.id}`} match={m} onClick={() => openMatch(m)} live />
            ))}
          </div>
        </div>
      )}

      {/* UPCOMING */}
      {upcomingMatches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-mono">Today's Fixtures</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingMatches.map((m) => (
              <MatchCard key={`up-${m.id}`} match={m} onClick={() => openMatch(m)} />
            ))}
          </div>
        </div>
      )}

      {/* RECENT */}
      {liveMatches.length === 0 && recentMatches.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-mono">Recent Results · Last 24h</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentMatches.slice(0, 12).map((m) => (
              <MatchCard key={`r-${m.id}`} match={m} onClick={() => openMatch(m)} />
            ))}
          </div>
        </div>
      )}

      {!loading && liveMatches.length === 0 && upcomingMatches.length === 0 && recentMatches.length === 0 && !error && (
        <div className="glass-card p-6 text-center text-sm text-muted-foreground">
          No matches found for this filter.
        </div>
      )}

      {/* Modal — Match Radar */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card max-w-3xl w-full max-h-[88vh] overflow-y-auto p-6 relative border border-white/10"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <MatchRadar match={selected} detail={detail} loading={detailLoading} />
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
  const finished = match.status?.finished;

  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`relative text-left w-full rounded-2xl p-4 backdrop-blur-xl border transition-all overflow-hidden group ${
        live
          ? 'bg-gradient-to-br from-red-500/10 via-background/40 to-background/20 border-red-500/30 hover:border-red-400/60'
          : 'bg-gradient-to-br from-white/[0.06] to-white/[0.02] border-white/10 hover:border-primary/40'
      }`}
    >
      {/* glow accent */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30 ${live ? 'bg-red-500' : 'bg-primary'}`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground truncate font-mono">
            {match.leagueName || 'Football'}
          </span>
          {live ? (
            <span className="text-[10px] font-mono text-red-400 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> {minute || 'LIVE'}
            </span>
          ) : finished ? (
            <span className="text-[10px] font-mono text-muted-foreground font-bold">FT</span>
          ) : (
            <span className="text-[10px] font-mono text-muted-foreground">{minute}</span>
          )}
        </div>

        <CardRow team={home} score={homeScore} live={live} />
        <CardRow team={away} score={awayScore} live={live} />
      </div>
    </motion.button>
  );
};

const CardRow = ({ team, score, live }: { team: any; score?: number; live?: boolean }) => (
  <div className="flex items-center justify-between py-1.5">
    <div className="flex items-center gap-2.5 min-w-0">
      <img
        src={teamLogo(team?.id)}
        alt=""
        className="w-7 h-7 object-contain shrink-0"
        onError={(e) => ((e.currentTarget.style.visibility = 'hidden'))}
      />
      <span className="text-sm font-semibold truncate">{team?.name || team?.longName || '—'}</span>
    </div>
    <span className={`text-xl font-bold tabular-nums font-display ${live ? 'text-red-400' : ''}`}>
      {score ?? '-'}
    </span>
  </div>
);

// ---------- Match Radar Modal ----------
const findStat = (items: { name: string; home: any; away: any }[], rx: RegExp) =>
  items.find((s) => rx.test(s.name));

const toNum = (v: any) => {
  if (v == null) return 0;
  const m = String(v).match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

const MatchRadar = ({ match, detail, loading }: { match: Match; detail: any; loading: boolean }) => {
  const stats = detail?.stats?.response || detail?.stats;
  const playersData = detail?.players?.response || detail?.players;
  const matchDetail = detail?.detail?.response || detail?.detail;
  const home = match.home || {};
  const away = match.away || {};
  const minute = match.status?.liveTime?.short || match.status?.startTimeStr || '';
  const live = isLive(match);

  // Flatten stats from various FotMob shapes
  const statItems = useMemo(() => {
    const list = stats?.statistics || stats?.stats || stats?.[0]?.stats || [];
    const flat: { name: string; home: any; away: any }[] = [];
    const walk = (node: any) => {
      if (!node) return;
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (node?.title && (node?.stats || node?.values)) {
        const vals = node.stats || node.values;
        flat.push({ name: node.title, home: vals?.[0], away: vals?.[1] });
      }
      if (node?.stats && Array.isArray(node.stats)) walk(node.stats);
      if (node?.items && Array.isArray(node.items)) walk(node.items);
    };
    walk(list);
    return flat;
  }, [stats]);

  const possession = findStat(statItems, /possession/i);
  const homePoss = possession ? toNum(possession.home) || 50 : 50;
  const awayPoss = possession ? toNum(possession.away) || (100 - homePoss) : 50;

  // Highlight tiles
  const shots = findStat(statItems, /^total shots|^shots$/i);
  const shotsOnTarget = findStat(statItems, /shots on target|on target/i);
  const corners = findStat(statItems, /corner/i);
  const fouls = findStat(statItems, /^fouls/i);
  const xg = findStat(statItems, /expected goals|\bxg\b/i);
  const passes = findStat(statItems, /pass accuracy|passes accurate|accurate passes/i);

  const highlights = [
    { icon: Crosshair, label: 'Shots', stat: shots },
    { icon: Target, label: 'On Target', stat: shotsOnTarget },
    { icon: Activity, label: 'xG', stat: xg },
    { icon: Flag, label: 'Corners', stat: corners },
    { icon: Activity, label: 'Pass Acc.', stat: passes },
    { icon: Flag, label: 'Fouls', stat: fouls },
  ].filter((h) => h.stat);

  // Player ratings
  const topPlayers = useMemo(() => {
    const list =
      playersData?.topRatedPlayers ||
      playersData?.players ||
      playersData?.response?.topRatedPlayers ||
      (Array.isArray(playersData) ? playersData : []);
    return Array.isArray(list) ? list.slice(0, 8) : [];
  }, [playersData]);

  // Head-to-head from match detail
  const h2h = useMemo(() => {
    const content = matchDetail?.content || matchDetail;
    const previous =
      content?.h2h?.matches ||
      content?.matchFacts?.previousMeetings?.matches ||
      content?.headToHead?.matches ||
      matchDetail?.h2h ||
      [];
    return Array.isArray(previous) ? previous.slice(0, 5) : [];
  }, [matchDetail]);

  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-mono">
        {match.leagueName || 'Football'} {minute && `· ${minute}`} {live && <span className="text-red-400 ml-1">● LIVE</span>}
      </div>

      {/* Scoreboard */}
      <div className="grid grid-cols-3 items-center gap-3 mb-6 p-5 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10">
        <div className="text-center">
          <img src={teamLogo(home.id)} alt="" className="w-14 h-14 object-contain mx-auto mb-2" />
          <div className="text-sm font-bold truncate">{home.name}</div>
        </div>
        <div className="text-center">
          <div className="font-display text-5xl font-bold tabular-nums">
            <span className={live ? 'text-red-400' : ''}>{home.score ?? '-'}</span>
            <span className="text-muted-foreground mx-2">:</span>
            <span className={live ? 'text-red-400' : ''}>{away.score ?? '-'}</span>
          </div>
          {possession && (
            <div className="text-[10px] font-mono text-muted-foreground mt-1">
              {homePoss}% poss {awayPoss}%
            </div>
          )}
        </div>
        <div className="text-center">
          <img src={teamLogo(away.id)} alt="" className="w-14 h-14 object-contain mx-auto mb-2" />
          <div className="text-sm font-bold truncate">{away.name}</div>
        </div>
      </div>

      {/* Highlight tiles */}
      {highlights.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            const hv = toNum(h.stat!.home);
            const av = toNum(h.stat!.away);
            const total = hv + av || 1;
            return (
              <div key={i} className="rounded-xl p-3 bg-white/[0.04] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5">
                  <Icon className="w-3 h-3" /> {h.label}
                </div>
                <div className="flex items-baseline justify-between text-sm font-bold tabular-nums mb-1">
                  <span className="text-blue-400">{String(h.stat!.home ?? '-')}</span>
                  <span className="text-red-400">{String(h.stat!.away ?? '-')}</span>
                </div>
                <div className="flex h-1 rounded-full overflow-hidden bg-white/5">
                  <div className="bg-blue-500" style={{ width: `${(hv / total) * 100}%` }} />
                  <div className="bg-red-500 ml-auto" style={{ width: `${(av / total) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pitch visualization */}
      <div className="mb-6">
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-mono">Pitch Radar</h4>
        <div className="relative aspect-[2/1] rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-green-900/40 via-green-800/30 to-green-900/40">
          {/* Pitch stripes */}
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 40px, rgba(255,255,255,0.04) 40px 80px)'
          }} />
          {/* Pitch lines */}
          <div className="absolute inset-0">
            <div className="absolute inset-2 border-2 border-white/30 rounded-sm" />
            <div className="absolute top-1/2 left-2 right-2 border-t-2 border-white/30 -translate-y-px" />
            <div className="absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 border-2 border-white/30 rounded-full" />
            <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-white/40 rounded-full" />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1/6 h-1/2 border-2 border-l-0 border-white/30" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1/6 h-1/2 border-2 border-r-0 border-white/30" />
          </div>
          {/* Possession overlay */}
          <div className="absolute inset-0 flex">
            <motion.div
              initial={{ width: '50%' }}
              animate={{ width: `${homePoss}%` }}
              transition={{ duration: 0.8 }}
              className="bg-blue-500/20 border-r border-white/40 flex items-end justify-start p-3"
            >
              <span className="text-xs font-mono font-bold text-white/90">{homePoss}% {home.name}</span>
            </motion.div>
            <motion.div
              initial={{ width: '50%' }}
              animate={{ width: `${awayPoss}%` }}
              transition={{ duration: 0.8 }}
              className="bg-red-500/20 flex items-end justify-end p-3"
            >
              <span className="text-xs font-mono font-bold text-white/90">{away.name} {awayPoss}%</span>
            </motion.div>
          </div>
          {/* Shot markers */}
          {shots && (
            <>
              <div className="absolute top-3 left-3 text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded-full border border-blue-400/40 text-blue-300">
                <Crosshair className="w-2.5 h-2.5 inline mr-1" />{String(shots.home)} shots
              </div>
              <div className="absolute top-3 right-3 text-[10px] font-mono bg-black/40 px-2 py-0.5 rounded-full border border-red-400/40 text-red-300">
                <Crosshair className="w-2.5 h-2.5 inline mr-1" />{String(shots.away)} shots
              </div>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading match radar...
        </div>
      )}

      {/* Full stats */}
      {!loading && statItems.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-mono flex items-center gap-1">
            <Activity className="w-3 h-3" /> Full Match Stats
          </h4>
          <div className="space-y-3">
            {statItems.slice(0, 12).map((s, i) => {
              const h = toNum(s.home);
              const a = toNum(s.away);
              const total = h + a || 1;
              return (
                <div key={i}>
                  <div className="grid grid-cols-3 text-xs gap-2 items-center mb-1">
                    <span className="text-right tabular-nums font-bold text-blue-300">{String(s.home ?? '-')}</span>
                    <span className="text-center text-muted-foreground font-mono uppercase tracking-wider text-[10px]">{s.name}</span>
                    <span className="text-left tabular-nums font-bold text-red-300">{String(s.away ?? '-')}</span>
                  </div>
                  <div className="flex h-1 rounded-full overflow-hidden bg-white/5">
                    <div className="bg-blue-500" style={{ width: `${(h / total) * 100}%` }} />
                    <div className="bg-red-500 ml-auto" style={{ width: `${(a / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top players */}
      {!loading && topPlayers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-mono flex items-center gap-1">
            <Star className="w-3 h-3" /> Top Rated Players
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topPlayers.map((p: any, i: number) => {
              const rating = p?.rating ?? p?.ratingNum ?? p?.stats?.rating;
              const r = toNum(rating);
              const tone = r >= 8 ? 'text-emerald-400 border-emerald-400/40' : r >= 7 ? 'text-yellow-400 border-yellow-400/40' : 'text-muted-foreground border-white/10';
              return (
                <div key={i} className="rounded-xl p-3 flex items-center justify-between bg-white/[0.04] border border-white/10">
                  <div className="min-w-0 flex items-center gap-2.5">
                    {p?.id && (
                      <img
                        src={`https://images.fotmob.com/image_resources/playerimages/${p.id}.png`}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover bg-white/5 shrink-0"
                        onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{p?.name || p?.playerName || '—'}</div>
                      <div className="text-[10px] text-muted-foreground truncate font-mono">
                        {p?.teamName || p?.team || p?.positionText || ''}
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold tabular-nums px-2 py-1 rounded-md border bg-black/30 ${tone}`}>
                    {rating ?? '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Head to Head */}
      {!loading && h2h.length > 0 && (
        <div className="mb-2">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-mono flex items-center gap-1">
            <History className="w-3 h-3" /> Head-to-Head · Last {h2h.length}
          </h4>
          <div className="space-y-2">
            {h2h.map((m: any, i: number) => {
              const hn = m?.home?.name || m?.homeTeam?.name || m?.team1 || '—';
              const an = m?.away?.name || m?.awayTeam?.name || m?.team2 || '—';
              const hs = m?.home?.score ?? m?.homeScore ?? m?.score1 ?? '-';
              const as_ = m?.away?.score ?? m?.awayScore ?? m?.score2 ?? '-';
              const date = m?.date || m?.matchDate || m?.utcTime || '';
              const league = m?.tournament?.name || m?.leagueName || '';
              return (
                <div key={i} className="rounded-xl p-3 bg-white/[0.03] border border-white/10 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="text-right text-xs font-semibold truncate">{hn}</div>
                  <div className="font-display text-base font-bold tabular-nums text-center px-2">
                    {hs} <span className="text-muted-foreground">-</span> {as_}
                  </div>
                  <div className="text-left text-xs font-semibold truncate">{an}</div>
                  {(date || league) && (
                    <div className="col-span-3 text-[10px] text-muted-foreground font-mono text-center truncate">
                      {league}{league && date ? ' · ' : ''}{date ? new Date(date).toLocaleDateString() : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && statItems.length === 0 && topPlayers.length === 0 && h2h.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Detailed radar data will appear once the match starts.
        </div>
      )}
    </div>
  );
};

export default ProMatchCenter;
