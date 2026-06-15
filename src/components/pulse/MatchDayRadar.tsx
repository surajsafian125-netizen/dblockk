import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface Fixture {
  id: number;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute: number | string | null;
  utcDate: string;
  competition: string;
}

const isLive = (s: string) => ['IN_PLAY', 'LIVE', 'PAUSED'].includes(s);
const isFinished = (s: string) => s === 'FINISHED';

const formatKickoff = (utc: string) => {
  try {
    return new Date(utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const teamInitial = (name: string) =>
  `https://via.placeholder.com/40/333/fff?text=${encodeURIComponent(name.charAt(0))}`;

const MatchDayRadar = () => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => !t), 900);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data, error: err } = await supabase.functions.invoke('football-scores');
        if (err) throw err;
        const matches: Fixture[] = data?.matches ?? [];
        if (cancelled) return;
        if (matches.length === 0) {
          setError(true);
        } else {
          setFixtures(matches.slice(0, 6));
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    // Refresh every 60s so scores stay current as long as the site is open
    const refresh = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
  }, []);

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-5 flex items-center gap-2">
        ⚽ Match Day Radar
      </h2>

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm animate-pulse">
          Fetching live fixtures…
        </div>
      ) : error || fixtures.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-muted-foreground text-sm">
          No recent fixtures available right now. Check back shortly.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fixtures.map((fix, i) => (
            <motion.div
              key={fix.id ?? i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5 relative overflow-hidden"
            >
              {/* League badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  {fix.competition}
                </span>
                {isLive(fix.status) ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-400">
                    <span
                      className={`h-2 w-2 rounded-full bg-green-400 transition-opacity duration-300 ${
                        tick ? 'opacity-100' : 'opacity-30'
                      }`}
                    />
                    LIVE{fix.minute ? ` · ${fix.minute}'` : ''}
                  </span>
                ) : isFinished(fix.status) ? (
                  <span className="text-[11px] font-medium text-muted-foreground">FT</span>
                ) : (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {formatKickoff(fix.utcDate)}
                  </span>
                )}
              </div>

              {/* Teams row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={teamInitial(fix.home)}
                    alt={fix.home}
                    className="w-10 h-10 rounded-full bg-muted/30 object-contain p-1 shrink-0"
                    loading="lazy"
                  />
                  <span className="font-display font-semibold text-sm truncate">{fix.home}</span>
                </div>

                <div className="shrink-0 glass rounded-xl px-4 py-2 flex items-center gap-2">
                  <span className="font-display text-2xl font-bold tabular-nums">
                    {fix.homeScore ?? '-'}
                  </span>
                  <span className="text-muted-foreground text-lg">:</span>
                  <span className="font-display text-2xl font-bold tabular-nums">
                    {fix.awayScore ?? '-'}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                  <span className="font-display font-semibold text-sm truncate text-right">
                    {fix.away}
                  </span>
                  <img
                    src={teamInitial(fix.away)}
                    alt={fix.away}
                    className="w-10 h-10 rounded-full bg-muted/30 object-contain p-1 shrink-0"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Live minute progress bar */}
              {isLive(fix.status) && fix.minute && (
                <div className="mt-4 h-1 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    className="h-full bg-green-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((Number(fix.minute) / 90) * 100, 100)}%`,
                    }}
                    transition={{ duration: 1 }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchDayRadar;
