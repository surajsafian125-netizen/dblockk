// Edge function: proxy to free-api-live-football-data on RapidAPI
// Provides player search + player details (rating, formation/position, stats)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const RAPID_HOST = "free-api-live-football-data.p.rapidapi.com";

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

    let action = "search";
    let search = "";
    let playerId = "";

    if (req.method === "GET") {
      const url = new URL(req.url);
      action = url.searchParams.get("action") || "search";
      search = url.searchParams.get("search") || "";
      playerId = url.searchParams.get("playerId") || "";
    } else {
      const body = await req.json().catch(() => ({}));
      action = body.action || "search";
      search = body.search || "";
      playerId = body.playerId || "";
    }

    let endpoint = "";
    if (action === "search") {
      const q = (search || "m").trim().slice(0, 40);
      endpoint = `/football-players-search?search=${encodeURIComponent(q)}`;
    } else if (action === "player") {
      if (!playerId) {
        return new Response(JSON.stringify({ error: "playerId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      endpoint = `/football-get-player-detail?playerid=${encodeURIComponent(playerId)}`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(`https://${RAPID_HOST}${endpoint}`, {
      headers: {
        "x-rapidapi-host": RAPID_HOST,
        "x-rapidapi-key": apiKey,
      },
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=120",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
