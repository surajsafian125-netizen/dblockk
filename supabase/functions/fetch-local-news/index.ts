import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const NEWSDATA_ENDPOINT = 'https://newsdata.io/api/1/latest';
const FALLBACK_SUMMARY = 'Read full local coverage for developing details, official statements, and background.';

const cleanText = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return '';

  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

// NewsData's free tier returns placeholder strings instead of the article body.
const isUnusableBody = (value: string): boolean => {
  if (!value) return true;
  const v = value.toUpperCase();
  return (
    v.includes('ONLY AVAILABLE IN PAID PLAN') ||
    v.includes('ONLY AVAILABLE IN PROFESSIONAL AND CORPORATE PLAN') ||
    v.includes('ONLY AVAILABLE IN CORPORATE PLAN') ||
    value.replace(/\s+/g, ' ').trim().length < 240
  );
};

// Fetch the publisher page and pull out the readable paragraphs.
const scrapeArticle = async (link: string): Promise<string> => {
  try {
    const res = await fetch(link, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    if (!res.ok) return '';
    const html = await res.text();

    // Prefer the main article container when present.
    const articleMatch =
      html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i) ||
      html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
    const scope = articleMatch ? articleMatch[1] : html;

    const paragraphs = [...scope.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => cleanText(m[1]))
      .filter((p) => p.length > 60 && !/^(share|advertisement|read also|read more|follow us)/i.test(p));

    // Drop obvious duplicates while keeping order.
    const seen = new Set<string>();
    const unique = paragraphs.filter((p) => {
      const key = p.slice(0, 80).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.slice(0, 30).join('\n\n');
  } catch (e) {
    console.error('[fetch-local-news] scrape failed', link, (e as Error).message);
    return '';
  }
};

const buildBody = async (rawBody: string, link: string | null): Promise<string> => {
  let body = rawBody;
  if (isUnusableBody(body) && link) {
    const scraped = await scrapeArticle(link);
    if (scraped.length > body.length) body = scraped;
  }
  if (isUnusableBody(body) && !body) body = '';
  return body;
};

const extractLink = (content: string): string | null => {
  const m = content.match(/\((https?:\/\/[^\s)]+)\)/);
  return m ? m[1] : null;
};

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

    const payloadIn = await req.json().catch(() => ({}));
    const mode = payloadIn?.mode === 'repair' ? 'repair' : 'fetch';

    // --- Repair mode: replace placeholder bodies with scraped article text --
    if (mode === 'repair') {
      const { data: broken, error: brokenErr } = await admin
        .from('posts')
        .select('id, title, content, description')
        .eq('news_category', 'local')
        .ilike('content', '%ONLY AVAILABLE IN%')
        .limit(25);
      if (brokenErr) return json({ error: brokenErr.message }, 500);

      let repaired = 0;
      for (const post of broken ?? []) {
        const link = extractLink(post.content ?? '');
        if (!link) continue;
        const scraped = await scrapeArticle(link);
        if (!scraped || scraped.length < 240) continue;
        const words = scraped.split(/\s+/).length;
        const { error: upErr } = await admin
          .from('posts')
          .update({
            content: `${scraped}\n\n[Read the original report](${link})`,
            description:
              post.description && !isUnusableBody(post.description)
                ? post.description
                : scraped.slice(0, 500),
            reading_time: Math.max(1, Math.round(words / 200)),
          })
          .eq('id', post.id);
        if (!upErr) repaired += 1;
      }

      return json({ repaired, checked: broken?.length ?? 0 });
    }

    const apiKey = Deno.env.get('NEWSDATA_API_KEY');
    if (!apiKey) return json({ error: 'NEWSDATA_API_KEY is not configured' }, 500);

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

    const candidates = results.filter((r) => r.title && !seen.has(r.title)).slice(0, 15);

    const rows: any[] = [];
    for (const r of candidates) {
      const rawBody = cleanText(r.content || r.full_description || r.description || '');
      const body = await buildBody(rawBody, r.link ?? null);
      const finalBody = body || cleanText(r.description || r.title);
      const summary =
        cleanText(r.description || r.summary || r.contentSnippet || '') ||
        finalBody.slice(0, 400) ||
        FALLBACK_SUMMARY;
      const words = finalBody.split(/\s+/).length;
      rows.push({
        title: cleanText(r.title).slice(0, 300),
        content: r.link ? `${finalBody}\n\n[Read the original report](${r.link})` : finalBody,
        description: summary.slice(0, 500),
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
      });
    }

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
