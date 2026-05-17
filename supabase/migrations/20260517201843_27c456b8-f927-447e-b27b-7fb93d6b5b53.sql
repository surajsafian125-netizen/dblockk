
-- community_gigs: restrict public read; require authentication
DROP POLICY IF EXISTS "Public read approved gigs" ON public.community_gigs;

CREATE POLICY "Authenticated read approved gigs"
ON public.community_gigs
FOR SELECT
TO authenticated
USING (is_approved = true);

-- likes: restrict public read; require authentication
DROP POLICY IF EXISTS "Public read likes" ON public.likes;

CREATE POLICY "Authenticated read likes"
ON public.likes
FOR SELECT
TO authenticated
USING (true);
