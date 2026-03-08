
CREATE TABLE public.client_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  email text NOT NULL,
  service text NOT NULL,
  budget_range text,
  project_details text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a lead (public insert)
CREATE POLICY "Anyone can submit leads"
  ON public.client_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read leads
CREATE POLICY "Admin read leads"
  ON public.client_leads
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update leads
CREATE POLICY "Admin update leads"
  ON public.client_leads
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete leads
CREATE POLICY "Admin delete leads"
  ON public.client_leads
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
