import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Fixture {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  status: string;
  minute: string | null;
  utcDate: string;
  competition: string;
}

const FALLBACK: Fixture[] = [
  { home: 'Real Madrid', away: 'Man City', homeScore: 2, awayScore: 1, status: 'IN_PLAY', minute: "78'", utcDate: '', competition: 'Champions League' },
  { home: 'Bayern Munich', away: 'PSG', homeScore: 0, awayScore: 0, status: 'SCHEDULED', minute: '20:45', utcDate: '', competition: 'Champions League' },
  { home: 'Barcelona', away: 'Inter Milan', homeScore: 3, awayScore: 2, status: 'FINISHED', minute: 'FT', utcDate: '', competition: 'Champions League' },
];

const statusLabel = (f: Fixture) => {
  if (['IN_PLAY', 'LIVE', 'PAUSED'].includes(f.status))
    return `● LIVE ${f.minute || ''}`;
  if (f.status === 'FINISHED') return 'Full Time';
  // SCHEDULED — show kickoff time
  if (f.utcDate) {
    try {
      return new Date(f.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { /* fall through */ }
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

const MatchDay = () => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('football-scores');
        if (error) throw error;
        const matches: Fixture[] = data?.matches ?? [];
        if (matches.length === 0) throw new Error('No matches');
        setFixtures(matches.slice(0, 3));
        setIsLive(true);
      } catch {
        setFixtures(FALLBACK);
        setIsLive(false);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass glow rounded-2xl p-6 h-full relative"
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.4)]" />
          </span>
          <span className="text-[10px] font-medium text-green-400 uppercase tracking-wider">Live Data</span>
        </div>
      )}

      <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        Match <span className="text-primary text-glow">Day</span>
      </h3>

      {loading ? (
        <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm animate-pulse">
          Fetching live scores…
        </div>
      ) : (
        <div className="space-y-3">
          {fixtures.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl bg-background/30 border border-border/30"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0 ${statusClass(f.status)}`}
                >
                  {statusLabel(f)}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{f.competition}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex-1">{f.home}</span>
                <div className="flex items-center gap-2 px-4">
                  <span className="font-display text-lg font-bold">{f.homeScore}</span>
                  <span className="text-muted-foreground text-xs">-</span>
                  <span className="font-display text-lg font-bold">{f.awayScore}</span>
                </div>
                <span className="text-sm font-medium flex-1 text-right">{f.away}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MatchDay;
