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

    // Subscribers (treat all rows as active; unsubscribe deletes the row)
    const { data: subs, error: subErr } = await supabase
      .from('digest_subscribers')
      .select('email');
    if (subErr) throw subErr;

    const emails = (subs ?? []).map(s => s.email).filter(Boolean);
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

    const origin = req.headers.get('origin') || 'https://dblockk.lovable.app';

    const itemsHtml = (posts ?? []).map(p => `
      <tr><td style="padding:16px 0;border-bottom:1px solid #1f2937;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#60a5fa;margin-bottom:6px;">${p.category ?? ''}</div>
        <a href="${origin}/?post=${p.id}" style="font-size:18px;font-weight:600;color:#f8fafc;text-decoration:none;line-height:1.35;">${p.title}</a>
        ${p.description ? `<p style="margin:8px 0 0;color:#94a3b8;font-size:14px;line-height:1.5;">${p.description}</p>` : ''}
      </td></tr>
    `).join('');

    const html = `<!DOCTYPE html><html><body style="margin:0;background:#0b1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1120;padding:40px 20px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:rgba(15,23,42,0.8);border:1px solid rgba(59,130,246,0.2);border-radius:16px;padding:40px;">
            <tr><td>
              <h1 style="margin:0 0 8px;font-size:28px;color:#f8fafc;">D'Block Weekly Digest</h1>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">Your top 5 signals from the block.</p>
              <table width="100%">${itemsHtml}</table>
              <div style="margin-top:32px;padding-top:24px;border-top:1px solid #1f2937;text-align:center;color:#64748b;font-size:12px;">
                D'block | Ask. Discover. Elevate.
              </div>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`;

    // TEST MODE: Resend sandbox only allows sending to the account owner's verified email.
    const TEST_TO = 'surajmohammed129@gmail.com';
    const batch = [{
      from: 'D\'Block <onboarding@resend.dev>',
      to: [TEST_TO],
      subject: "D'Block Weekly Digest — 5 signals to catch up on",
      html,
    }];

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
      return new Response(
        JSON.stringify({ error: 'Resend failed', status: res.status, details: body }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ sent: emails.length, posts: posts?.length ?? 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[send-weekly-digest] error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
