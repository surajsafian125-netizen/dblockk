import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, Activity, Wifi, Terminal, CheckCircle2, Users, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'blocked' | 'success';
  source: string;
  message: string;
}

interface Stats {
  totalUsers: number;
  last24h: {
    posts: number;
    comments: number;
    likes: number;
    bookmarks: number;
    leads: number;
    gigs: number;
  };
  window: string;
  generatedAt: string;
}

const typeColor = (t: LogEntry['type']) =>
  t === 'info' ? 'text-primary'
  : t === 'warning' ? 'text-yellow-400'
  : t === 'blocked' ? 'text-red-400'
  : 'text-emerald-400';

const typeIcon = (t: LogEntry['type']) =>
  t === 'info' ? '●' : t === 'warning' ? '▲' : t === 'blocked' ? '✕' : '✓';

const SecurityTerminal = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('security-stats');
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error ?? 'Failed');
      setLogs(data.logs ?? []);
      setStats(data.stats);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const iv = setInterval(fetchStats, 30000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const totalEvents24h = stats
    ? stats.last24h.posts + stats.last24h.comments + stats.last24h.likes + stats.last24h.bookmarks + stats.last24h.leads + stats.last24h.gigs
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden mb-6"
      style={{ boxShadow: '0 0 30px hsl(var(--glow) / 0.1), 0 0 60px hsl(var(--glow) / 0.05), inset 0 1px 0 hsl(var(--glass-border) / 0.1)' }}
    >
      <div className="px-6 py-4 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="h-5 w-5 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="font-display text-lg font-semibold">Live Activity Terminal</h2>
          <span className="text-[10px] font-mono text-muted-foreground bg-secondary/40 rounded px-1.5 py-0.5">REAL DATA</span>
        </div>
        <button
          onClick={fetchStats}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 font-mono"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          {stats ? new Date(stats.generatedAt).toLocaleTimeString() : '—'}
        </button>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="rounded-lg border border-red-400/30 bg-red-400/5 px-4 py-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-red-400">Failed to load stats</p>
              <p className="text-[10px] text-red-400/70 font-mono mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-secondary/20 border border-border/20 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/5 rounded-full blur-xl" />
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground font-mono">TOTAL USERS</span>
            </div>
            <span className="text-3xl font-bold font-mono text-emerald-400" style={{ textShadow: '0 0 20px rgba(52, 211, 153, 0.4)' }}>
              {stats ? stats.totalUsers.toLocaleString() : '—'}
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400/80 font-mono">REGISTERED ACCOUNTS</span>
            </div>
          </div>

          <div className="rounded-xl bg-secondary/20 border border-border/20 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-xl" />
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-mono">EVENTS (24H)</span>
            </div>
            <span className="text-3xl font-bold font-mono text-primary" style={{ textShadow: '0 0 20px hsl(var(--primary) / 0.4)' }}>
              {stats ? totalEvents24h.toLocaleString() : '—'}
            </span>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-mono">P:{stats?.last24h.posts ?? 0}</span>
              <span className="text-[10px] text-muted-foreground font-mono">C:{stats?.last24h.comments ?? 0}</span>
              <span className="text-[10px] text-muted-foreground font-mono">L:{stats?.last24h.likes ?? 0}</span>
              <span className="text-[10px] text-muted-foreground font-mono">B:{stats?.last24h.bookmarks ?? 0}</span>
            </div>
          </div>

          <div className="rounded-xl bg-secondary/20 border border-border/20 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/5 rounded-full blur-xl" />
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-muted-foreground font-mono">PENDING REVIEW</span>
            </div>
            <span className="text-3xl font-bold font-mono text-yellow-400" style={{ textShadow: '0 0 20px rgba(250, 204, 21, 0.4)' }}>
              {stats ? (stats.last24h.leads + stats.last24h.gigs) : '—'}
            </span>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-muted-foreground font-mono">LEADS:{stats?.last24h.leads ?? 0}</span>
              <span className="text-[10px] text-muted-foreground font-mono">GIGS:{stats?.last24h.gigs ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/20 overflow-hidden">
          <div className="bg-secondary/30 px-4 py-2 flex items-center justify-between border-b border-border/10">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">activity.log — last 24h</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
            </div>
          </div>
          <div
            ref={logRef}
            className="bg-background/80 p-4 h-56 overflow-y-auto font-mono text-xs space-y-1"
            style={{ scrollBehavior: 'smooth' }}
          >
            {loading && logs.length === 0 ? (
              <div className="text-muted-foreground/50 text-center py-8">Loading real activity data…</div>
            ) : logs.length === 0 ? (
              <div className="text-muted-foreground/50 text-center py-8">No activity recorded in the last 24 hours.</div>
            ) : (
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2 leading-relaxed"
                  >
                    <span className="text-muted-foreground/50 shrink-0">{log.timestamp}</span>
                    <span className={`shrink-0 ${typeColor(log.type)}`}>{typeIcon(log.type)}</span>
                    <span className="text-muted-foreground/70 shrink-0">[{log.source}]</span>
                    <span className="text-foreground/70">{log.message}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityTerminal;
