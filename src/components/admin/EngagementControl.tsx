import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Eye, Save, RefreshCw, Loader2, Users, ChevronDown, ChevronUp, RotateCcw, Minus, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Row {
  id: string;
  title: string;
  views: number;
  likes_count: number;
  created_at: string | null;
}

interface Liker {
  user_id: string;
  emoji: string;
  created_at: string | null;
  name: string;
  handle: string | null;
}

const EngagementControl = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [likers, setLikers] = useState<Record<string, Liker[]>>({});
  const [drafts, setDrafts] = useState<Record<string, { views: string; likes: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: posts, error: postsError }, { data: likes }] = await Promise.all([
      supabase.from('posts').select('id,title,views,likes_count,created_at').order('created_at', { ascending: false }),
      supabase.from('likes').select('post_id,user_id,emoji,created_at').order('created_at', { ascending: false }),
    ]);

    if (postsError) {
      toast.error('Could not load posts');
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set((likes ?? []).map(l => l.user_id)));
    let profileMap: Record<string, { display_name: string | null; handle: string }> = {};
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id,display_name,handle')
        .in('id', userIds);
      profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, { display_name: p.display_name, handle: p.handle }]));
    }

    const grouped: Record<string, Liker[]> = {};
    (likes ?? []).forEach(l => {
      const p = profileMap[l.user_id];
      (grouped[l.post_id] ||= []).push({
        user_id: l.user_id,
        emoji: l.emoji ?? 'like',
        created_at: l.created_at,
        name: p?.display_name || p?.handle || 'Private reader',
        handle: p?.handle ?? null,
      });
    });

    const mapped: Row[] = (posts ?? []).map(p => ({
      id: p.id,
      title: p.title,
      views: p.views ?? 0,
      likes_count: p.likes_count ?? 0,
      created_at: p.created_at,
    }));

    setRows(mapped);
    setLikers(grouped);
    setDrafts(Object.fromEntries(mapped.map(p => [p.id, { views: String(p.views), likes: String(p.likes_count) }])));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-likes-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const setDraft = (id: string, key: 'views' | 'likes', value: string) =>
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));

  const bump = (id: string, key: 'views' | 'likes', delta: number) =>
    setDrafts(prev => {
      const current = parseInt(prev[id]?.[key] ?? '0', 10) || 0;
      return { ...prev, [id]: { ...prev[id], [key]: String(Math.max(0, current + delta)) } };
    });

  const save = async (row: Row) => {
    const d = drafts[row.id];
    const views = Math.max(0, Math.min(999999999, parseInt(d?.views ?? '0', 10) || 0));
    const likes = Math.max(0, Math.min(999999999, parseInt(d?.likes ?? '0', 10) || 0));
    setSavingId(row.id);
    const { error } = await supabase.from('posts').update({ views, likes_count: likes }).eq('id', row.id);
    setSavingId(null);
    if (error) {
      toast.error('Could not save. Admin access required.');
      return;
    }
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, views, likes_count: likes } : r)));
    toast.success('Engagement updated');
  };

  const syncToReal = async (row: Row) => {
    const real = likers[row.id]?.length ?? 0;
    setDraft(row.id, 'likes', String(real));
    setSavingId(row.id);
    const { error } = await supabase.from('posts').update({ likes_count: real }).eq('id', row.id);
    setSavingId(null);
    if (error) {
      toast.error('Could not sync likes');
      return;
    }
    setRows(prev => prev.map(r => (r.id === row.id ? { ...r, likes_count: real } : r)));
    toast.success(`Likes set to real count (${real})`);
  };

  const visible = rows.filter(r => r.title.toLowerCase().includes(query.trim().toLowerCase()));
  const totalReal = Object.values(likers).reduce((sum, l) => sum + l.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glow rounded-2xl p-6 mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" /> Likes &amp; Views Control
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {totalReal} real reaction{totalReal === 1 ? '' : 's'} from readers across {rows.length} posts
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="glass glass-hover rounded-xl px-3 py-2 text-xs flex items-center gap-2 shrink-0 disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search posts by title..."
        className="w-full bg-secondary/30 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
      />

      {loading && rows.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading engagement data…
        </div>
      )}

      {!loading && visible.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No posts match that search.</p>
      )}

      <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
        {visible.map(row => {
          const list = likers[row.id] ?? [];
          const d = drafts[row.id] ?? { views: '0', likes: '0' };
          const dirty = String(row.views) !== d.views || String(row.likes_count) !== d.likes;
          const isOpen = expanded === row.id;

          return (
            <div key={row.id} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium truncate">{row.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'No date'} · {list.length} real like{list.length === 1 ? '' : 's'}
                  </p>
                </div>
                {list.length > 0 && (
                  <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium flex items-center gap-1 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Liked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['views', 'likes'] as const).map(key => (
                  <div key={key} className="flex items-center gap-2">
                    {key === 'views' ? (
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <Heart className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <button
                      onClick={() => bump(row.id, key, -1)}
                      className="glass glass-hover rounded-lg p-1.5 shrink-0"
                      aria-label={`Decrease ${key}`}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={d[key]}
                      onChange={e => setDraft(row.id, key, e.target.value)}
                      className="w-full min-w-0 bg-secondary/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button
                      onClick={() => bump(row.id, key, 1)}
                      className="glass glass-hover rounded-lg p-1.5 shrink-0"
                      aria-label={`Increase ${key}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  onClick={() => save(row)}
                  disabled={savingId === row.id || !dirty}
                  className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 hover:opacity-90 transition-all"
                >
                  {savingId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </button>
                <button
                  onClick={() => syncToReal(row)}
                  disabled={savingId === row.id}
                  className="glass glass-hover rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Match real likes ({list.length})
                </button>
                {list.length > 0 && (
                  <button
                    onClick={() => setExpanded(isOpen ? null : row.id)}
                    className="glass glass-hover rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    <Users className="h-3.5 w-3.5" /> Who liked
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>

              {isOpen && list.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3">
                  {list.map((l, i) => (
                    <div key={`${l.user_id}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate">
                        {l.handle ? (
                          <a href={`/u/${l.handle}`} className="text-primary hover:underline">@{l.handle}</a>
                        ) : (
                          <span className="text-muted-foreground">{l.name}</span>
                        )}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        {l.emoji} · {l.created_at ? new Date(l.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default EngagementControl;
