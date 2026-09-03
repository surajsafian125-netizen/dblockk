import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Clock, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Row {
  id: string;
  title: string;
  status: string | null;
  published: boolean | null;
  publish_at: string | null;
  created_at: string | null;
  category: string;
}

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ContentCalendar = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [month, setMonth] = useState(() => new Date());

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('id, title, status, published, publish_at, created_at, category')
      .order('created_at', { ascending: false })
      .limit(300);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const unpublished = rows.filter(r => !r.published);

  const schedule = async (id: string) => {
    const value = drafts[id];
    if (!value) {
      toast.error('Pick a date and time first');
      return;
    }
    setSaving(id);
    const iso = new Date(value).toISOString();
    const { error } = await supabase
      .from('posts')
      .update({ publish_at: iso, status: 'scheduled', published: false })
      .eq('id', id);
    setSaving(null);
    if (error) return toast.error('Could not schedule');
    toast.success('Scheduled');
    setRows(prev => prev.map(r => (r.id === id ? { ...r, publish_at: iso, status: 'scheduled' } : r)));
  };

  const clearSchedule = async (id: string) => {
    setSaving(id);
    const { error } = await supabase
      .from('posts')
      .update({ publish_at: null, status: 'draft' })
      .eq('id', id);
    setSaving(null);
    if (error) return toast.error('Could not clear schedule');
    setRows(prev => prev.map(r => (r.id === id ? { ...r, publish_at: null, status: 'draft' } : r)));
  };

  const publishNow = async (id: string) => {
    setSaving(id);
    const { error } = await supabase
      .from('posts')
      .update({ published: true, status: 'published', publish_at: null })
      .eq('id', id);
    setSaving(null);
    if (error) return toast.error('Could not publish');
    toast.success('Published');
    setRows(prev => prev.map(r => (r.id === id ? { ...r, published: true, status: 'published', publish_at: null } : r)));
  };

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const lead = first.getDay();
    const map = new Map<number, Row[]>();
    rows.forEach(r => {
      const ref = r.publish_at ?? (r.published ? r.created_at : null);
      if (!ref) return;
      const d = new Date(ref);
      if (d.getFullYear() !== month.getFullYear() || d.getMonth() !== month.getMonth()) return;
      const key = d.getDate();
      map.set(key, [...(map.get(key) ?? []), r]);
    });
    return { lead, days, map };
  }, [rows, month]);

  const shiftMonth = (delta: number) =>
    setMonth(m => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-5 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold">Content Calendar &amp; Scheduling</h2>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading schedule…
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Drafts &amp; scheduled ({unpublished.length})
            </p>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {unpublished.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing waiting to be published.</p>
              )}
              {unpublished.map(r => (
                <div key={r.id} className="glass rounded-xl p-3">
                  <p className="text-sm font-medium line-clamp-2">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {r.category}
                    {r.publish_at && (
                      <span className="ml-2 text-primary">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {new Date(r.publish_at).toLocaleString()}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <input
                      type="datetime-local"
                      value={drafts[r.id] ?? toLocalInput(r.publish_at)}
                      onChange={e => setDrafts(p => ({ ...p, [r.id]: e.target.value }))}
                      className="glass rounded-lg px-2 py-1.5 text-xs bg-transparent outline-none"
                    />
                    <button
                      onClick={() => schedule(r.id)}
                      disabled={saving === r.id}
                      className="rounded-lg bg-primary/15 text-primary px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                    >
                      Schedule
                    </button>
                    {r.publish_at && (
                      <button
                        onClick={() => clearSchedule(r.id)}
                        className="rounded-lg glass glass-hover px-3 py-1.5 text-xs text-muted-foreground"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => publishNow(r.id)}
                      disabled={saving === r.id}
                      className="rounded-lg glass glass-hover px-3 py-1.5 text-xs flex items-center gap-1 disabled:opacity-50"
                    >
                      <Send className="h-3 w-3" /> Publish now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => shiftMonth(-1)} className="glass glass-hover rounded-lg px-2.5 py-1 text-xs">
                ‹
              </button>
              <p className="text-sm font-medium">
                {month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
              </p>
              <button onClick={() => shiftMonth(1)} className="glass glass-hover rounded-lg px-2.5 py-1 text-xs">
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: cells.lead }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {Array.from({ length: cells.days }).map((_, i) => {
                const day = i + 1;
                const items = cells.map.get(day) ?? [];
                return (
                  <div
                    key={day}
                    title={items.map(x => x.title).join('\n')}
                    className={`min-h-[54px] rounded-lg p-1 text-[10px] border ${
                      items.length ? 'border-primary/30 bg-primary/5' : 'border-border/20'
                    }`}
                  >
                    <span className="text-muted-foreground">{day}</span>
                    {items.slice(0, 2).map(x => (
                      <p key={x.id} className="truncate text-foreground/80">
                        {x.title}
                      </p>
                    ))}
                    {items.length > 2 && (
                      <p className="text-primary">+{items.length - 2}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ContentCalendar;
