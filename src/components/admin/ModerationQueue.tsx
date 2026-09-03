import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, Loader2, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Report {
  id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
}

const ModerationQueue = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('post_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    const list = (data as Report[]) ?? [];
    setReports(list);
    const ids = [...new Set(list.map(r => r.post_id).filter(Boolean))] as string[];
    if (ids.length) {
      const { data: posts } = await supabase.from('posts').select('id, title').in('id', ids);
      setTitles(Object.fromEntries((posts ?? []).map(p => [p.id, p.title])));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    const { error } = await supabase.from('post_reports').update({ status }).eq('id', id);
    setBusy(null);
    if (error) return toast.error('Could not update report');
    setReports(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  };

  const removeContent = async (report: Report) => {
    setBusy(report.id);
    const { error } = report.comment_id
      ? await supabase.from('comments').delete().eq('id', report.comment_id)
      : await supabase.from('posts').delete().eq('id', report.post_id!);
    setBusy(null);
    if (error) return toast.error('Could not delete content');
    toast.success('Content removed');
    await setStatus(report.id, 'actioned');
  };

  const open = reports.filter(r => r.status === 'open');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-5 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Flag className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-bold">Moderation Queue</h2>
        {open.length > 0 && (
          <span className="rounded-full bg-destructive/15 text-destructive text-[11px] font-bold px-2 py-0.5">
            {open.length} open
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading reports…
        </div>
      ) : reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reports yet. The community is behaving.</p>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {reports.map(r => (
            <div key={r.id} className="glass rounded-xl p-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {r.reason}
                    <span className="ml-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {r.comment_id ? 'comment' : 'post'}
                    </span>
                  </p>
                  {r.post_id && titles[r.post_id] && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{titles[r.post_id]}</p>
                  )}
                  {r.details && <p className="text-xs text-foreground/80 mt-1">{r.details}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${
                    r.status === 'open'
                      ? 'bg-destructive/15 text-destructive'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {r.status}
                </span>
              </div>
              {r.status === 'open' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setStatus(r.id, 'dismissed')}
                    disabled={busy === r.id}
                    className="rounded-lg glass glass-hover px-3 py-1.5 text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <Check className="h-3 w-3" /> Dismiss
                  </button>
                  <button
                    onClick={() => removeContent(r)}
                    disabled={busy === r.id}
                    className="rounded-lg bg-destructive/10 text-destructive px-3 py-1.5 text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" /> Remove content
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ModerationQueue;
