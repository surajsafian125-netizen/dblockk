-- Fix 1: Restrict analytics_settings to authenticated users (was public)
DROP POLICY IF EXISTS "Public read analytics" ON public.analytics_settings;
CREATE POLICY "Authenticated read analytics" ON public.analytics_settings
  FOR SELECT TO authenticated
  USING (true);

-- Fix 2: Restrict storage delete to admin only (was any authenticated user)
DROP POLICY IF EXISTS "Auth delete post media" ON storage.objects;
CREATE POLICY "Admin delete post media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-media'
    AND public.has_role(auth.uid(), 'admin')
  );