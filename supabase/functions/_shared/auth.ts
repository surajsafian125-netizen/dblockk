// Shared JWT auth helpers for edge functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type AuthedUser = { id: string; email?: string };

function client(token: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
}

/** Returns the authenticated user or null when the token is missing/invalid. */
export async function getUser(req: Request): Promise<AuthedUser | null> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  if (!token) return null;

  const { data, error } = await client(token).auth.getUser();
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? undefined };
}

/** Returns the authenticated admin user or null. */
export async function getAdminUser(req: Request): Promise<AuthedUser | null> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  if (!token) return null;

  const supabase = client(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;

  const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
    _user_id: data.user.id,
    _role: "admin",
  });
  if (roleError || isAdmin !== true) return null;

  return { id: data.user.id, email: data.user.email ?? undefined };
}

export function unauthorized(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
