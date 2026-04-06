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
    const API_KEY = Deno.env.get("YOUTUBE_API_KEY") ?? Deno.env.get("VITE_YOUTUBE_API_KEY");
    if (!API_KEY) {
      console.error("YOUTUBE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "YouTube service is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const query = "latest European football match highlights";
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "8",
      order: "date",
      videoDuration: "medium",
      relevanceLanguage: "en",
      key: API_KEY,
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error("YouTube API error:", res.status, errBody);
      return new Response(
        JSON.stringify({ error: `YouTube API error ${res.status}: ${errBody.slice(0, 300)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();

    const highlights = (data.items || []).map((item: any) => ({
      id: item.id?.videoId || "",
      title: item.snippet?.title || "",
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || "",
      channelTitle: item.snippet?.channelTitle || "",
      publishedAt: item.snippet?.publishedAt || "",
      videoUrl: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
    }));

    return new Response(JSON.stringify({ highlights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("youtube-highlights error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
