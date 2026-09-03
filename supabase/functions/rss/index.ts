import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://dblockk.lovable.app";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, description, category, tags, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return new Response("Feed unavailable", { status: 500 });
  }

  const items = (data ?? []).map((p) => `
    <item>
      <title>${esc(p.title ?? "")}</title>
      <link>${SITE}/?post=${p.id}</link>
      <guid isPermaLink="false">${p.id}</guid>
      <description>${esc(p.description ?? "")}</description>
      <category>${esc(p.category ?? "")}</category>
      <pubDate>${new Date(p.created_at ?? Date.now()).toUTCString()}</pubDate>
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>D'Block</title>
    <link>${SITE}</link>
    <description>Culture, tech, sport and hustle — curated by D'Block.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
