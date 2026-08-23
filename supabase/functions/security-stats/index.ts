import { getAdminUser, unauthorized } from '../_shared/auth.ts';
// Real project stats from Supabase (auth + public tables) using service role.
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

type LogEntry = {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'blocked' | 'success';
  source: string;
  message: string;
};

const fmtTime = (iso: string) => new Date(iso).toISOString().split('T')[1].split('.')[0];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = await getAdminUser(req);
  if (!admin) return unauthorized(corsHeaders);


  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Real data: total users, recent posts, recent comments, recent likes, recent bookmarks, leads, gigs
    const [usersList, postsRes, commentsRes, likesRes, bookmarksRes, leadsRes, gigsRes, recentPosts, recentComments, recentLikes, recentLeads, recentGigs] = await Promise.all([
      supabase.auth.admin.listUsers({ page: 1, perPage: 1 }),
      supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('comments').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('likes').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('bookmarks').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('client_leads').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('community_gigs').select('id', { count: 'exact', head: true }).gte('created_at', since),
      supabase.from('posts').select('id,title,created_at,published').order('created_at', { ascending: false }).limit(8),
      supabase.from('comments').select('id,created_at,post_id').order('created_at', { ascending: false }).limit(8),
      supabase.from('likes').select('id,created_at,post_id').order('created_at', { ascending: false }).limit(8),
      supabase.from('client_leads').select('id,created_at,name,status').order('created_at', { ascending: false }).limit(5),
      supabase.from('community_gigs').select('id,created_at,title,status').order('created_at', { ascending: false }).limit(5),
    ]);

    const totalUsers = (usersList.data as any)?.total ?? 0;

    const logs: LogEntry[] = [];
    let blocked = 0;

    for (const p of recentPosts.data ?? []) {
      logs.push({
        id: `p-${p.id}`,
        timestamp: fmtTime(p.created_at),
        type: p.published ? 'success' : 'info',
        source: 'Posts',
        message: `${p.published ? 'PUBLISHED' : 'DRAFT'} — "${String(p.title).slice(0, 60)}"`,
      });
    }
    for (const c of recentComments.data ?? []) {
      logs.push({
        id: `c-${c.id}`,
        timestamp: fmtTime(c.created_at),
        type: 'info',
        source: 'Comments',
        message: `New comment on post ${String(c.post_id).slice(0, 8)}…`,
      });
    }
    for (const l of recentLikes.data ?? []) {
      logs.push({
        id: `l-${l.id}`,
        timestamp: fmtTime(l.created_at),
        type: 'success',
        source: 'Likes',
        message: `Like recorded on post ${String(l.post_id).slice(0, 8)}…`,
      });
    }
    for (const ld of recentLeads.data ?? []) {
      const isNew = ld.status === 'new';
      if (!isNew) blocked++; // count non-new as something
      logs.push({
        id: `ld-${ld.id}`,
        timestamp: fmtTime(ld.created_at),
        type: isNew ? 'warning' : 'success',
        source: 'Client Leads',
        message: `Partner inquiry — ${ld.name} (${ld.status})`,
      });
    }
    for (const g of recentGigs.data ?? []) {
      const pending = g.status === 'pending';
      logs.push({
        id: `g-${g.id}`,
        timestamp: fmtTime(g.created_at),
        type: pending ? 'warning' : 'success',
        source: 'Community Gigs',
        message: `Gig "${String(g.title).slice(0, 40)}" — ${g.status}`,
      });
    }

    logs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    return new Response(
      JSON.stringify({
        ok: true,
        logs: logs.slice(-40),
        stats: {
          totalUsers,
          last24h: {
            posts: postsRes.count ?? 0,
            comments: commentsRes.count ?? 0,
            likes: likesRes.count ?? 0,
            bookmarks: bookmarksRes.count ?? 0,
            leads: leadsRes.count ?? 0,
            gigs: gigsRes.count ?? 0,
          },
          window: '24h',
          generatedAt: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
