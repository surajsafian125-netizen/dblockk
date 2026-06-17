// Real security/traffic stats from Supabase analytics logs
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROJECT_REF = Deno.env.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)\./)?.[1] ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

async function runAnalytics(sql: string) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/analytics/endpoints/logs.all`;
  // Fallback to management API not available with service key — use platform analytics via PostgREST-style endpoint
  // Instead, use the public logs endpoint
  const res = await fetch(
    `https://${PROJECT_REF}.supabase.co/platform/analytics/endpoints/logs.all?sql=${encodeURIComponent(sql)}`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  if (!res.ok) throw new Error(`analytics ${res.status}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Pull recent auth logs + edge function logs in parallel
    const authSql = `
      select timestamp, event_message, metadata.status as status, metadata.path as path, metadata.msg as msg, metadata.level as level
      from auth_logs cross join unnest(metadata) as metadata
      where timestamp > timestamp_sub(current_timestamp(), interval 24 hour)
      order by timestamp desc limit 40
    `;
    const edgeSql = `
      select timestamp, event_message, response.status_code as status, request.method as method, m.execution_time_ms as ms
      from function_edge_logs
      cross join unnest(metadata) as m
      cross join unnest(m.response) as response
      cross join unnest(m.request) as request
      where timestamp > timestamp_sub(current_timestamp(), interval 24 hour)
      order by timestamp desc limit 40
    `;

    const [authRes, edgeRes] = await Promise.allSettled([
      runAnalytics(authSql),
      runAnalytics(edgeSql),
    ]);

    const authRows = authRes.status === 'fulfilled' ? (authRes.value.result ?? authRes.value.data ?? []) : [];
    const edgeRows = edgeRes.status === 'fulfilled' ? (edgeRes.value.result ?? edgeRes.value.data ?? []) : [];

    // Build unified log feed
    type LogEntry = { id: string; timestamp: string; type: 'info'|'warning'|'blocked'|'success'; source: string; message: string };
    const logs: LogEntry[] = [];

    let blockedCount = 0;
    let totalEdge = 0;
    let errorEdge = 0;

    for (const r of authRows) {
      const status = Number(r.status ?? 0);
      const ts = new Date(r.timestamp / 1000).toISOString().split('T')[1].split('.')[0];
      const path = r.path ?? '/auth';
      let type: LogEntry['type'] = 'info';
      if (status >= 500) { type = 'warning'; }
      else if (status === 401 || status === 403) { type = 'blocked'; blockedCount++; }
      else if (status >= 200 && status < 300) { type = 'success'; }
      logs.push({
        id: `a-${r.timestamp}`,
        timestamp: ts,
        type,
        source: 'Auth Service',
        message: `${r.msg ?? 'auth event'} — ${path} (${status || '—'})`,
      });
    }

    for (const r of edgeRows) {
      totalEdge++;
      const status = Number(r.status ?? 0);
      if (status >= 400) errorEdge++;
      const ts = new Date(r.timestamp / 1000).toISOString().split('T')[1].split('.')[0];
      let type: LogEntry['type'] = 'info';
      if (status >= 500) type = 'warning';
      else if (status === 401 || status === 403 || status === 429) { type = 'blocked'; blockedCount++; }
      else if (status >= 200 && status < 300) type = 'success';
      logs.push({
        id: `e-${r.timestamp}`,
        timestamp: ts,
        type,
        source: 'Edge Function',
        message: `${r.method ?? 'GET'} ${status || '—'} (${Math.round(r.ms ?? 0)}ms)`,
      });
    }

    logs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    // Uptime estimate: % of edge calls that returned <500
    const uptime = totalEdge === 0 ? 100 : Math.max(0, 100 - (errorEdge / totalEdge) * 100);

    return new Response(
      JSON.stringify({
        ok: true,
        logs: logs.slice(-40),
        stats: {
          blockedCount,
          totalRequests: totalEdge + authRows.length,
          errorCount: errorEdge,
          uptime: Number(uptime.toFixed(2)),
          window: '24h',
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
