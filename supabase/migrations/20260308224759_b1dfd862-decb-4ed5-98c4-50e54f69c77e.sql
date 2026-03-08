
CREATE TABLE public.community_gigs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  contact_info text NOT NULL,
  category text NOT NULL DEFAULT 'Collab',
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_gigs ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved gigs
CREATE POLICY "Public read approved gigs" ON public.community_gigs
  FOR SELECT USING (is_approved = true);

-- Authenticated users can submit gigs
CREATE POLICY "Auth insert gigs" ON public.community_gigs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admin can read all gigs (including unapproved)
CREATE POLICY "Admin read all gigs" ON public.community_gigs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update gigs (approve)
CREATE POLICY "Admin update gigs" ON public.community_gigs
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete gigs (reject)
CREATE POLICY "Admin delete gigs" ON public.community_gigs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
