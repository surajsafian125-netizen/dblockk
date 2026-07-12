import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: subs, error: subErr } = await supabase
      .from('digest_subscribers')
      .select('email');
    if (subErr) throw subErr;

    const emails = Array.from(
      new Set((subs ?? []).map((s: any) => (s.email ?? '').trim().toLowerCase()).filter(Boolean))
    );
    if (emails.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No subscribers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Top 5 recent published posts
    const { data: posts, error: postErr } = await supabase
      .from('posts')
      .select('id, title, description, category, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(5);
    if (postErr) throw postErr;

    const SITE_URL = 'https://dblockk.lovable.app';
    const origin = req.headers.get('origin') || SITE_URL;

    const escape = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const itemsHtml = (posts ?? []).map((p: any, i: number) => {
      const date = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      const desc = p.description ? escape(String(p.description)).slice(0, 240) : '';
      return `
        <tr><td style="padding:20px 0;border-bottom:1px solid #1f2937;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#60a5fa;margin-bottom:8px;font-weight:600;">
            #${i + 1} &middot; ${escape(p.category ?? 'Signal')} ${date ? `&middot; ${date}` : ''}
          </div>
          <a href="${origin}/?post=${p.id}" style="display:block;font-size:20px;font-weight:700;color:#f8fafc;text-decoration:none;line-height:1.3;margin-bottom:8px;">
            ${escape(p.title ?? 'Untitled')}
          </a>
          ${desc ? `<p style="margin:0 0 12px;color:#94a3b8;font-size:14px;line-height:1.6;">${desc}${desc.length >= 240 ? '&hellip;' : ''}</p>` : ''}
          <a href="${origin}/?post=${p.id}" style="display:inline-block;font-size:13px;color:#60a5fa;text-decoration:none;font-weight:600;">
            Read the full story &rarr;
          </a>
        </td></tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><body style="margin:0;background:#0b1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f8fafc;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1120;padding:40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:rgba(15,23,42,0.85);border:1px solid rgba(59,130,246,0.25);border-radius:16px;padding:40px;">
            <tr><td>
              <div style="font-size:12px;letter-spacing:3px;color:#60a5fa;text-transform:uppercase;margin-bottom:8px;">D'Block Weekly</div>
              <h1 style="margin:0 0 12px;font-size:30px;color:#f8fafc;line-height:1.2;">Your weekly digest is here</h1>
              <p style="margin:0 0 32px;color:#94a3b8;font-size:15px;line-height:1.6;">
                Here are the top ${posts?.length ?? 0} signals from the block this week &mdash; hand-picked stories, launches and moves you should not miss.
              </p>
              <table width="100%">${itemsHtml}</table>

              <div style="margin-top:36px;text-align:center;">
                <a href="${origin}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">
                  Explore D'Block &rarr;
                </a>
              </div>

              <p style="margin:32px 0 0;color:#cbd5e1;font-size:14px;line-height:1.6;text-align:center;">
                Visit the site for more information.<br/>
                <span style="color:#94a3b8;">Thank you.</span>
              </p>

              <div style="margin-top:32px;padding-top:24px;border-top:1px solid #1f2937;text-align:center;color:#64748b;font-size:12px;line-height:1.6;">
                D'Block &middot; Ask. Discover. Elevate.<br/>
                You are receiving this because you subscribed to the D'Block Weekly Digest.
              </div>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`;

    // Send one email per subscriber using BCC batching (Resend batch API)
    // Each recipient gets their own message (privacy).
    const from = "D'Block <onboarding@resend.dev>";
    const subject = "D'Block Weekly Digest — this week's top signals";

    // Resend batch endpoint accepts up to 100 messages per request.
    const chunks: string[][] = [];
    for (let i = 0; i < emails.length; i += 100) chunks.push(emails.slice(i, i + 100));

    let sent = 0;
    const failures: Array<{ status: number; details: string }> = [];

    for (const chunk of chunks) {
      const batch = chunk.map((to) => ({ from, to: [to], subject, html }));
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(batch),
      });
      const body = await res.text();
      if (!res.ok) {
        console.error('[send-weekly-digest] Resend error', res.status, body);
        failures.push({ status: res.status, details: body });
        continue;
      }
      sent += chunk.length;
    }

    if (sent === 0 && failures.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Resend failed for all recipients', failures }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        sent,
        total_subscribers: emails.length,
        posts: posts?.length ?? 0,
        failures: failures.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[send-weekly-digest] error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
