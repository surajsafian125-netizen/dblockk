import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOP_COMPETITIONS = [2001, 2002, 2014, 2019, 2021];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FOOTBALL_API_KEY");
    if (!apiKey) {
      throw new Error("FOOTBALL_API_KEY not configured");
    }

    // Construct today as yyyy-mm-dd
    const today = new Date().toISOString().split("T")[0];

    // Use football-data.org API with dateFrom, dateTo and status filters to fetch only today's live or finished matches for current season
    // Status options: SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED, SUSPENDED, POSTPONED, CANCELLED
    // We want IN_PLAY and FINISHED
    const url = `https://api.football-data.org/v4/matches?dateFrom=${today}&dateTo=${today}&status=IN_PLAY,FINISHED`;

    const res = await fetch(url, {
      headers: { "X-Auth-Token": apiKey },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Football API error:", res.status, errText);
      throw new Error(`API returned ${res.status}`);
    }

    const data = await res.json();
    const allMatches = (data.matches || []).filter((m: any) =>
      TOP_COMPETITIONS.includes(m.competition?.id)
    );

    // Build match list with events embedded
    const matches = allMatches.slice(0, 6).map((m: any) => {
      // Extract goals from score breakdown + bookings from the match object
      const events: any[] = [];

      // Goals from the goals array if available
      if (m.goals && Array.isArray(m.goals)) {
        m.goals.forEach((g: any) => {
          events.push({
            type: "GOAL",
            minute: g.minute || "?",
            team: g.team?.shortName || g.team?.name || "?",
            player: g.scorer?.name || "Unknown",
            detail: g.type === "OWN" ? "Own Goal" : g.type === "PENALTY" ? "Penalty" : null,
          });
        });
      }

      // Bookings if available
      if (m.bookings && Array.isArray(m.bookings)) {
        m.bookings.forEach((b: any) => {
          events.push({
            type: b.card === "RED" ? "RED_CARD" : "YELLOW_CARD",
            minute: b.minute || "?",
            team: b.team?.shortName || b.team?.name || "?",
            player: b.player?.name || "Unknown",
            detail: null,
          });
        });
      }

      // Sort events by minute
      events.sort((a: any, b: any) => {
        const am = parseInt(a.minute) || 0;
        const bm = parseInt(b.minute) || 0;
        return am - bm;
      });

      return {
        id: m.id,
        home: m.homeTeam?.shortName || m.homeTeam?.name || "TBD",
        away: m.awayTeam?.shortName || m.awayTeam?.name || "TBD",
        homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
        awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
        status: m.status,
        minute: m.minute || null,
        utcDate: m.utcDate,
        competition: m.competition?.name || "Football",
        events,
      };
    });

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("football-scores error:", err);
    return new Response(
      JSON.stringify({ matches: [], error: "Unable to fetch scores at this time" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
