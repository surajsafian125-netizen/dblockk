import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Fixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeCrest: string;
  awayCrest: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'LIVE' | 'FT' | 'NS';
  minute: number | null;
  kickoff: string;
  league: string;
}

const FIXTURES: Fixture[] = [
  {
    id: 1,
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    homeCrest: 'https://crests.football-data.org/57.png',
    awayCrest: 'https://crests.football-data.org/61.png',
    homeScore: 2,
    awayScore: 1,
    status: 'LIVE',
    minute: 74,
    kickoff: '15:00',
    league: 'Premier League',
  },
  {
    id: 2,
    homeTeam: 'Barcelona',
    awayTeam: 'Real Madrid',
    homeCrest: 'https://crests.football-data.org/81.png',
    awayCrest: 'https://crests.football-data.org/86.png',
    homeScore: 1,
    awayScore: 1,
    status: 'LIVE',
    minute: 38,
    kickoff: '20:00',
    league: 'La Liga',
  },
  {
    id: 3,
    homeTeam: 'Bayern Munich',
    awayTeam: 'Dortmund',
    homeCrest: 'https://crests.football-data.org/5.png',
    awayCrest: 'https://crests.football-data.org/4.png',
    homeScore: 3,
    awayScore: 0,
    status: 'FT',
    minute: null,
    kickoff: '12:30',
    league: 'Bundesliga',
  },
  {
    id: 4,
    homeTeam: 'PSG',
    awayTeam: 'Marseille',
    homeCrest: 'https://crests.football-data.org/524.png',
    awayCrest: 'https://crests.football-data.org/516.png',
    homeScore: null,
    awayScore: null,
    status: 'NS',
    minute: null,
    kickoff: '21:00',
    league: 'Ligue 1',
  },
];

const MatchDayRadar = () => {
  const [fixtures] = useState<Fixture[]>(FIXTURES);
  const [tick, setTick] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => !t), 900);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      <h2 className="font-display text-xl font-semibold mb-5 flex items-center gap-2">
        ⚽ Match Day Radar
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fixtures.map((fix, i) => (
          <motion.div
            key={fix.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-2xl p-5 relative overflow-hidden"
          >
            {/* League badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                {fix.league}
              </span>
              {fix.status === 'LIVE' && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-400">
                  <span
                    className={`h-2 w-2 rounded-full bg-green-400 transition-opacity duration-300 ${
                      tick ? 'opacity-100' : 'opacity-30'
                    }`}
                  />
                  LIVE · {fix.minute}&apos;
                </span>
              )}
              {fix.status === 'FT' && (
                <span className="text-[11px] font-medium text-muted-foreground">FT</span>
              )}
              {fix.status === 'NS' && (
                <span className="text-[11px] font-medium text-muted-foreground">
                  {fix.kickoff}
                </span>
              )}
            </div>

            {/* Teams row */}
            <div className="flex items-center justify-between gap-3">
              {/* Home */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={fix.homeCrest}
                  alt={fix.homeTeam}
                  className="w-10 h-10 rounded-full bg-muted/30 object-contain p-1 shrink-0"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/40/333/fff?text=' +
                      fix.homeTeam.charAt(0);
                  }}
                />
                <span className="font-display font-semibold text-sm truncate">
                  {fix.homeTeam}
                </span>
              </div>

              {/* Score */}
              <div className="shrink-0 glass rounded-xl px-4 py-2 flex items-center gap-2">
                <span className="font-display text-2xl font-bold tabular-nums">
                  {fix.homeScore ?? '-'}
                </span>
                <span className="text-muted-foreground text-lg">:</span>
                <span className="font-display text-2xl font-bold tabular-nums">
                  {fix.awayScore ?? '-'}
                </span>
              </div>

              {/* Away */}
              <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                <span className="font-display font-semibold text-sm truncate text-right">
                  {fix.awayTeam}
                </span>
                <img
                  src={fix.awayCrest}
                  alt={fix.awayTeam}
                  className="w-10 h-10 rounded-full bg-muted/30 object-contain p-1 shrink-0"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/40/333/fff?text=' +
                      fix.awayTeam.charAt(0);
                  }}
                />
              </div>
            </div>

            {/* Live minute progress bar */}
            {fix.status === 'LIVE' && fix.minute && (
              <div className="mt-4 h-1 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  className="h-full bg-green-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((fix.minute / 90) * 100, 100)}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MatchDayRadar;
