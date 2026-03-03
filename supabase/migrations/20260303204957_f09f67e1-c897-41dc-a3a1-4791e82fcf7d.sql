
-- Drop all existing restrictive policies on posts
DROP POLICY IF EXISTS "Admin delete posts" ON public.posts;
DROP POLICY IF EXISTS "Admin insert posts" ON public.posts;
DROP POLICY IF EXISTS "Admin update posts" ON public.posts;
DROP POLICY IF EXISTS "Public read" ON public.posts;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Public read posts"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "Admin insert posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
