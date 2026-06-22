import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, User, Trophy, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PlayerSuggestion {
  id: string;
  name: string;
  teamName?: string;
  teamId?: number;
  isCoach?: boolean;
}

interface DetailItem {
  title: string;
  value: { numberValue?: number; fallback?: any; key?: string | null };
  countryCode?: string;
}

const renderValue = (v: DetailItem['value']) => {
  if (!v) return '—';
  if (typeof v.fallback === 'string' || typeof v.fallback === 'number') return String(v.fallback);
  if (v.fallback?.utcTime) return new Date(v.fallback.utcTime).toLocaleDateString();
  if (v.numberValue !== undefined) return String(v.numberValue);
  return '—';
};

const PlayerIntel = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlayerSuggestion[]>([]);
  const [selected, setSelected] = useState<PlayerSuggestion | null>(null);
  const [detail, setDetail] = useState<DetailItem[] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('football-players', {
        body: { action: 'search', search: query.trim() },
      });
      if (error) throw error;
      const suggestions = (data?.response?.suggestions || []).filter(
        (s: any) => s.type === 'player' && !s.isCoach,
      );
      setResults(suggestions.slice(0, 18));
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const openPlayer = async (p: PlayerSuggestion) => {
    setSelected(p);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('football-players', {
        body: { action: 'player', playerId: p.id },
      });
      if (error) throw error;
      setDetail(data?.response?.detail || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load player');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="h-6 w-6 text-primary" />
        <div>
          <h3 className="font-display text-lg font-semibold">Sports Intel — Player Search</h3>
          <p className="text-xs text-muted-foreground">Live FotMob data: ratings, market value, position, contract & more</p>
        </div>
      </div>

      <form onSubmit={runSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any footballer (e.g. Messi, Haaland, Bellingham)…"
            className="pl-9 bg-background/40"
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((p) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => openPlayer(p)}
              className="text-left p-3 rounded-xl bg-background/30 border border-white/5 hover:border-primary/40 hover:bg-background/50 transition flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.teamName || 'Free agent'}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Type a player name and hit Search to load live profile data.
        </p>
      )}

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
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass max-w-lg w-full rounded-2xl border border-white/10 p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                    <User className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="font-display text-xl font-bold">{selected.name}</h4>
                    <p className="text-sm text-muted-foreground">{selected.teamName || 'Free agent'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {detailLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {detail && detail.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {detail.map((d, i) => (
                    <div key={i} className="p-3 rounded-lg bg-background/40 border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.title}</p>
                      <p className="font-semibold mt-1">{renderValue(d.value)}</p>
                    </div>
                  ))}
                </div>
              )}

              {detail && detail.length === 0 && !detailLoading && (
                <p className="text-sm text-muted-foreground text-center py-6">No additional details available.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayerIntel;
