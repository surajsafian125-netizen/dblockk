import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const NEWSDATA_ENDPOINT = 'https://newsdata.io/api/1/latest';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const apiKey = Deno.env.get('NEWSDATA_API_KEY');
    if (!apiKey) return json({ error: 'NEWSDATA_API_KEY is not configured' }, 500);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // --- Auth: admin only -------------------------------------------------
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });
    if (!isAdmin) return json({ error: 'Forbidden' }, 403);

    // --- Fetch Ghanaian news ---------------------------------------------
    const url = new URL(NEWSDATA_ENDPOINT);
    url.searchParams.set('apikey', apiKey);
    url.searchParams.set('country', 'gh');
    url.searchParams.set('language', 'en');

    const res = await fetch(url.toString());
    const payload = await res.json().catch(() => null);

    if (!res.ok || payload?.status === 'error') {
      console.error('[fetch-local-news] NewsData error', res.status, payload);
      return json(
        { error: payload?.results?.message || 'NewsData.io request failed' },
        res.status === 429 ? 429 : 502,
      );
    }

    const results: any[] = Array.isArray(payload?.results) ? payload.results : [];
    if (results.length === 0) return json({ inserted: 0, message: 'No local articles returned' });

    // Skip duplicates already in the database
    const titles = results.map((r) => r.title).filter(Boolean);
    const { data: existing } = await admin
      .from('posts')
      .select('title')
      .in('title', titles);
    const seen = new Set((existing ?? []).map((e: any) => e.title));

    const rows = results
      .filter((r) => r.title && !seen.has(r.title))
      .slice(0, 15)
      .map((r) => {
        const body: string = r.content || r.description || r.title;
        const words = body.split(/\s+/).length;
        return {
          title: String(r.title).slice(0, 300),
          content: r.link ? `${body}\n\n[Read the original report](${r.link})` : body,
          description: (r.description || body).slice(0, 200),
          category: 'Local News',
          news_category: 'local',
          status: 'draft',
          published: false,
          image_url: r.image_url || null,
          tags: ['ghana', 'local-news'],
          user_id: userData.user.id,
          views: 0,
          likes_count: 0,
          engagement_score: 0,
          reading_time: Math.max(1, Math.round(words / 200)),
          is_trending: false,
        };
      });

    if (rows.length === 0) return json({ inserted: 0, message: 'All fetched articles already exist' });

    const { error: insertErr } = await admin.from('posts').insert(rows);
    if (insertErr) {
      console.error('[fetch-local-news] insert error', insertErr);
      return json({ error: insertErr.message }, 500);
    }

    return json({ inserted: rows.length });
  } catch (e) {
    console.error('[fetch-local-news] unexpected', e);
    return json({ error: (e as Error).message || 'Unexpected error' }, 500);
  }
});
