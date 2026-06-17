// Securely fetch remote/freelance jobs from JSearch (RapidAPI).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('JSEARCH_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing JSEARCH_API_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    let query = url.searchParams.get('query') ?? 'remote developer';
    let page = url.searchParams.get('page') ?? '1';
    let remoteOnly = url.searchParams.get('remote_only') ?? 'true';
    let employmentTypes = url.searchParams.get('employment_types') ?? 'FULLTIME,CONTRACTOR,PARTTIME';

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (typeof body?.query === 'string') query = body.query;
        if (body?.page) page = String(body.page);
        if (body?.remote_only !== undefined) remoteOnly = String(body.remote_only);
        if (typeof body?.employment_types === 'string') employmentTypes = body.employment_types;
      } catch (_) { /* ignore */ }
    }

    const params = new URLSearchParams({
      query,
      page,
      num_pages: '1',
      date_posted: 'week',
      remote_jobs_only: remoteOnly,
      employment_types: employmentTypes,
    });

    const jsearchUrl = `https://jsearch.p.rapidapi.com/search?${params.toString()}`;
    const resp = await fetch(jsearchUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error('JSearch error', resp.status, text.slice(0, 500));
      return new Response(JSON.stringify({ error: `JSearch API error (${resp.status})` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = await resp.json();
    const jobs = (json?.data ?? []).map((j: any) => ({
      id: j.job_id,
      title: j.job_title,
      employer: j.employer_name,
      employer_logo: j.employer_logo,
      city: j.job_city,
      country: j.job_country,
      is_remote: j.job_is_remote,
      employment_type: j.job_employment_type,
      description: j.job_description,
      apply_link: j.job_apply_link,
      posted_at: j.job_posted_at_datetime_utc,
      salary_min: j.job_min_salary,
      salary_max: j.job_max_salary,
      salary_currency: j.job_salary_currency,
      salary_period: j.job_salary_period,
    }));

    return new Response(JSON.stringify({ ok: true, jobs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
