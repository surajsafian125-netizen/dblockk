
-- Fix: Unpublished posts readable by anonymous users
DROP POLICY IF EXISTS "Public read posts" ON public.posts;
CREATE POLICY "Public read published posts" ON public.posts
  FOR SELECT USING (published = true);

-- Fix: client_leads insert policy uses WITH CHECK (true) which is overly permissive
-- Replace with a more restrictive check that still allows anonymous submissions
-- but validates that required fields are not empty
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.client_leads;
CREATE POLICY "Anyone can submit leads" ON public.client_leads
  FOR INSERT WITH CHECK (
    company_name IS NOT NULL AND
    email IS NOT NULL AND
    service IS NOT NULL AND
    length(company_name) > 0 AND
    length(email) > 0 AND
    length(service) > 0
  );
