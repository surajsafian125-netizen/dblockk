import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, ShieldAlert, Lock, Key, Activity, Wifi, WifiOff, Terminal, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'info' | 'warning' | 'blocked' | 'success';
  source: string;
  message: string;
}

const SOURCES = ['API Gateway', 'Auth Service', 'CDN Edge', 'Firewall', 'Load Balancer', 'DNS Resolver', 'Rate Limiter', 'WAF'];
const REGIONS = ['US-East', 'EU-West', 'AP-South', 'AF-West', 'SA-East'];
const IPS = () => `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

const MESSAGES: Array<{ type: LogEntry['type']; msg: () => string }> = [
  { type: 'info', msg: () => `GET /api/v1/posts — 200 OK (${Math.floor(Math.random() * 80 + 10)}ms) from ${REGIONS[Math.floor(Math.random() * REGIONS.length)]}` },
  { type: 'info', msg: () => `POST /api/v1/auth/session — Token refreshed for user_${Math.random().toString(36).slice(2, 8)}` },
  { type: 'success', msg: () => `SSL certificate verified — TLS 1.3 handshake complete` },
  { type: 'info', msg: () => `Health check ping from ${SOURCES[Math.floor(Math.random() * SOURCES.length)]} — latency ${Math.floor(Math.random() * 15 + 1)}ms` },
  { type: 'warning', msg: () => `Rate limit threshold 80% — ${IPS()} (${Math.floor(Math.random() * 50 + 30)} req/min)` },
  { type: 'blocked', msg: () => `BLOCKED: Suspicious payload from ${IPS()} — SQL injection attempt on /api/v1/search` },
  { type: 'blocked', msg: () => `BLOCKED: Brute force attempt on /auth/login from ${IPS()} (${Math.floor(Math.random() * 20 + 5)} failed attempts)` },
  { type: 'info', msg: () => `WebSocket connection established — client_${Math.random().toString(36).slice(2, 8)} subscribed to realtime` },
  { type: 'success', msg: () => `CDN cache purge completed — ${Math.floor(Math.random() * 500 + 100)} objects invalidated` },
  { type: 'warning', msg: () => `Unusual traffic spike detected from ${REGIONS[Math.floor(Math.random() * REGIONS.length)]} — monitoring` },
  { type: 'blocked', msg: () => `BLOCKED: XSS attempt from ${IPS()} — sanitized input on /api/v1/comments` },
  { type: 'info', msg: () => `DNS resolution: ${Math.floor(Math.random() * 5 + 1)}ms — Edge node ${REGIONS[Math.floor(Math.random() * REGIONS.length)]}` },
  { type: 'success', msg: () => `Backup snapshot completed — ${(Math.random() * 2 + 0.5).toFixed(1)}GB compressed` },
  { type: 'info', msg: () => `API key validated — scope: read:posts,write:comments — expires in ${Math.floor(Math.random() * 30 + 1)}d` },
];

let logIdCounter = 0;

const generateLog = (): LogEntry => {
  const entry = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  return {
    id: ++logIdCounter,
    timestamp: new Date().toISOString().split('T')[1].split('.')[0],
    type: entry.type,
    source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
    message: entry.msg(),
  };
};

const SecurityTerminal = () => {
  const [logs, setLogs] = useState<LogEntry[]>(() => Array.from({ length: 8 }, generateLog));
  const [blockedCount, setBlockedCount] = useState(247);
  const [lockdownMode, setLockdownMode] = useState(false);
  const [apiRotation, setApiRotation] = useState(false);
  const [uptime] = useState(99.97);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog = generateLog();
      setLogs(prev => [...prev.slice(-40), newLog]);
      if (newLog.type === 'blocked') {
        setBlockedCount(prev => prev + 1);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const typeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'info': return 'text-primary';
      case 'warning': return 'text-yellow-400';
      case 'blocked': return 'text-red-400';
      case 'success': return 'text-emerald-400';
    }
  };

  const typeIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'info': return '●';
      case 'warning': return '▲';
      case 'blocked': return '✕';
      case 'success': return '✓';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden mb-6"
      style={{
        boxShadow: '0 0 30px hsl(var(--glow) / 0.1), 0 0 60px hsl(var(--glow) / 0.05), inset 0 1px 0 hsl(var(--glass-border) / 0.1)',
      }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="h-5 w-5 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h2 className="font-display text-lg font-semibold">Security & Traffic Terminal</h2>
          <span className="text-[10px] font-mono text-muted-foreground bg-secondary/40 rounded px-1.5 py-0.5">LIVE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-mono">SECURE</span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Uptime */}
          <div className="rounded-xl bg-secondary/20 border border-border/20 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/5 rounded-full blur-xl" />
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground font-mono">UPTIME STATUS</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-emerald-400" style={{ textShadow: '0 0 20px rgba(52, 211, 153, 0.4)' }}>
                {uptime}
              </span>
              <span className="text-sm text-emerald-400/70">%</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400/80 font-mono">ALL SYSTEMS OPERATIONAL</span>
            </div>
          </div>

          {/* Blocked Requests */}
          <div className="rounded-xl bg-secondary/20 border border-border/20 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-400/5 rounded-full blur-xl" />
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <span className="text-xs text-muted-foreground font-mono">BLOCKED REQUESTS</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-red-400" style={{ textShadow: '0 0 20px rgba(248, 113, 113, 0.4)' }}>
                {blockedCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <AlertTriangle className="h-3 w-3 text-yellow-400" />
              <span className="text-[10px] text-yellow-400/80 font-mono">+{Math.floor(Math.random() * 12 + 3)} LAST 24H</span>
            </div>
          </div>

          {/* Site Health */}
          <div className="rounded-xl bg-secondary/20 border border-border/20 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-xl" />
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-mono">SITE HEALTH</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-primary" style={{ textShadow: '0 0 20px hsl(var(--primary) / 0.4)' }}>
                A+
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-muted-foreground font-mono">SSL ✓</span>
              <span className="text-[10px] text-muted-foreground font-mono">RLS ✓</span>
              <span className="text-[10px] text-muted-foreground font-mono">WAF ✓</span>
            </div>
          </div>
        </div>

        {/* Live Terminal Log */}
        <div className="rounded-xl border border-border/20 overflow-hidden">
          <div className="bg-secondary/30 px-4 py-2 flex items-center justify-between border-b border-border/10">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">traffic_monitor.log</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
            </div>
          </div>
          <div
            ref={logRef}
            className="bg-background/80 p-4 h-56 overflow-y-auto font-mono text-xs space-y-1"
            style={{ scrollBehavior: 'smooth' }}
          >
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
                  <span className={`${log.type === 'blocked' ? 'text-red-400/90' : log.type === 'warning' ? 'text-yellow-400/80' : 'text-foreground/70'}`}>
                    {log.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Lockdown Mode */}
          <div className={`rounded-xl border p-4 transition-all duration-300 ${
            lockdownMode
              ? 'border-red-400/30 bg-red-400/5'
              : 'border-border/20 bg-secondary/20'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${lockdownMode ? 'bg-red-400/10' : 'bg-secondary/30'}`}>
                  {lockdownMode ? <WifiOff className="h-4 w-4 text-red-400" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div>
                  <p className="text-sm font-medium">Lockdown Mode</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {lockdownMode ? 'ACTIVE — ALL EXTERNAL ACCESS BLOCKED' : 'INACTIVE — Normal operations'}
                  </p>
                </div>
              </div>
              <Switch
                checked={lockdownMode}
                onCheckedChange={setLockdownMode}
                className={lockdownMode ? 'data-[state=checked]:bg-red-500' : ''}
              />
            </div>
          </div>

          {/* API Key Rotation */}
          <div className={`rounded-xl border p-4 transition-all duration-300 ${
            apiRotation
              ? 'border-primary/30 bg-primary/5'
              : 'border-border/20 bg-secondary/20'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${apiRotation ? 'bg-primary/10' : 'bg-secondary/30'}`}>
                  <Key className={`h-4 w-4 ${apiRotation ? 'text-primary animate-spin' : 'text-muted-foreground'}`} style={apiRotation ? { animationDuration: '3s' } : {}} />
                </div>
                <div>
                  <p className="text-sm font-medium">API Key Rotation</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {apiRotation ? 'AUTO-ROTATE EVERY 24H' : 'MANUAL — Keys static'}
                  </p>
                </div>
              </div>
              <Switch
                checked={apiRotation}
                onCheckedChange={setApiRotation}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SecurityTerminal;
