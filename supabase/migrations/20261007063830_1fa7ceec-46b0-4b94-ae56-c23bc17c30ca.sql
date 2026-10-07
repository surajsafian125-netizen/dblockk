DROP POLICY IF EXISTS "Authenticated read likes" ON public.likes;
CREATE POLICY "Users read own likes or admin" ON public.likes FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.post_reaction_counts(p_post_id uuid)
RETURNS TABLE(emoji text, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(l.emoji,'like'), count(*)::bigint FROM public.likes l
  WHERE l.post_id = p_post_id AND auth.uid() IS NOT NULL GROUP BY 1;
$$;
REVOKE EXECUTE ON FUNCTION public.post_reaction_counts(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.post_reaction_counts(uuid) TO authenticated;

DROP POLICY IF EXISTS "Authenticated read analytics" ON public.analytics_settings;
CREATE POLICY "Admin read analytics" ON public.analytics_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.public_analytics()
RETURNS TABLE(total_views text, total_users text, engagement_rate text, growth text,
  views_change text, users_change text, engagement_change text, growth_change text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT total_views, total_users, engagement_rate, growth, views_change, users_change, engagement_change, growth_change
  FROM public.analytics_settings WHERE auth.uid() IS NOT NULL ORDER BY updated_at DESC NULLS LAST LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.public_analytics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.public_analytics() TO authenticated;

DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Signed-in read comments" ON public.comments FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth upload post media" ON storage.objects;
CREATE POLICY "Admin upload post media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media' AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Public read post media" ON storage.objects;
CREATE POLICY "Admin list post media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'post-media' AND public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.public_profile_activity(p_user_id uuid, p_limit integer DEFAULT 12)
RETURNS SETOF posts LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM public.posts p
  WHERE p.published = true
    AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p_user_id AND (pr.is_public = true OR pr.id = auth.uid()))
    AND (EXISTS (SELECT 1 FROM public.bookmarks b WHERE b.post_id = p.id AND b.user_id = p_user_id)
      OR EXISTS (SELECT 1 FROM public.likes l WHERE l.post_id = p.id AND l.user_id = p_user_id))
  ORDER BY p.created_at DESC
  LIMIT LEAST(coalesce(p_limit, 12), 50);
$$;