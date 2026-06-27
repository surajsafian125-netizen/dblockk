// Edge function: proxy to free-api-live-football-data on RapidAPI
// Automated live football dashboard data (live matches, match details, top players)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const RAPID_HOST = "free-api-live-football-data.p.rapidapi.com";

async function rapid(endpoint: string, apiKey: string) {
  const res = await fetch(`https://${RAPID_HOST}${endpoint}`, {
    headers: { "x-rapidapi-host": RAPID_HOST, "x-rapidapi-key": apiKey },
  });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, data: text };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RAPIDAPI_FOOTBALL_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "RAPIDAPI_FOOTBALL_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let action = "live";
    let matchId = "";

    if (req.method === "GET") {
      const url = new URL(req.url);
      action = url.searchParams.get("action") || "live";
      matchId = url.searchParams.get("matchId") || "";
    } else {
      const body = await req.json().catch(() => ({}));
      action = body.action || "live";
      matchId = body.matchId || "";
    }

    if (action === "live") {
      const fmt = (d: Date) =>
        `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const todayStr = fmt(today);
      const yesterdayStr = fmt(yesterday);
      const [live, today_, yest_] = await Promise.all([
        rapid("/football-current-live", apiKey),
        rapid(`/football-get-matches-by-date?date=${todayStr}`, apiKey),
        rapid(`/football-get-matches-by-date?date=${yesterdayStr}`, apiKey),
      ]);
      return new Response(
        JSON.stringify({
          live: live.data,
          today: today_.data,
          yesterday: yest_.data,
          date: todayStr,
          yesterdayDate: yesterdayStr,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=30" } },
      );
    }

    if (action === "match") {
      if (!matchId) {
        return new Response(JSON.stringify({ error: "matchId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const [detail, stats, players] = await Promise.all([
        rapid(`/football-get-match-detail?matchid=${encodeURIComponent(matchId)}`, apiKey),
        rapid(`/football-get-match-statistics?matchid=${encodeURIComponent(matchId)}`, apiKey),
        rapid(`/football-get-top-rated-players-by-match?matchid=${encodeURIComponent(matchId)}`, apiKey),
      ]);
      return new Response(
        JSON.stringify({ detail: detail.data, stats: stats.data, players: players.data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=30" } },
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
