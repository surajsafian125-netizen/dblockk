import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FOOTBALL_API_KEY");
    if (!apiKey) {
      throw new Error("FOOTBALL_API_KEY not configured");
    }

    // Try today's matches across top competitions
    // Competition IDs: PL=2021, CL=2001, BL1=2002, SA=2019, PD=2014
    const today = new Date().toISOString().split("T")[0];
    const url = `https://api.football-data.org/v4/matches?date=${today}`;

    const res = await fetch(url, {
      headers: { "X-Auth-Token": apiKey },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Football API error:", res.status, errText);
      throw new Error(`API returned ${res.status}`);
    }

    const data = await res.json();
    const matches = (data.matches || [])
      // Prioritise top-tier competitions
      .filter((m: any) =>
        [2001, 2002, 2014, 2019, 2021].includes(m.competition?.id)
      )
      .slice(0, 5)
      .map((m: any) => ({
        home: m.homeTeam?.shortName || m.homeTeam?.name || "TBD",
        away: m.awayTeam?.shortName || m.awayTeam?.name || "TBD",
        homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
        awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
        status: m.status, // SCHEDULED, LIVE, IN_PLAY, PAUSED, FINISHED, etc.
        minute: m.minute || null,
        utcDate: m.utcDate,
        competition: m.competition?.name || "Football",
      }));

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("football-scores error:", err);
    return new Response(
      JSON.stringify({ matches: [], error: err.message }),
      {
        status: 200, // Return 200 so frontend can gracefully fallback
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
