import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getAdminUser, unauthorized } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = await getAdminUser(req);
  if (!admin) return unauthorized(corsHeaders);

  let notificationId: string;
  try {
    const body = await req.json();
    notificationId = String(body?.notificationId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(notificationId)) return json({ error: "Invalid notificationId" }, 400);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const pub = Deno.env.get("VAPID_PUBLIC_KEY");
  const priv = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!pub || !priv) return json({ error: "Push not configured" }, 500);
  webpush.setVapidDetails("mailto:surajmohammed129@gmail.com", pub, priv);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: n, error } = await db.from("notifications").select("*").eq("id", notificationId).maybeSingle();
  if (error || !n) return json({ error: "Notification not found" }, 404);

  let q = db.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  if (n.user_id) q = q.eq("user_id", n.user_id);
  const { data: subs } = await q;

  const payload = JSON.stringify({ id: n.id, title: n.title || "D'Block", body: n.message, link: n.link || "/" });
  let sent = 0;
  const stale: string[] = [];
  await Promise.all((subs ?? []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 });
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) stale.push(s.id);
      else console.error("push error", e?.statusCode, e?.body);
    }
  }));
  if (stale.length) await db.from("push_subscriptions").delete().in("id", stale);

  return json({ sent, removed: stale.length, total: subs?.length ?? 0 });
});
