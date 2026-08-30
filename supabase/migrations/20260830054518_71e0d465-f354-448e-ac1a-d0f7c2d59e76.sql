-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text NOT NULL UNIQUE,
  display_name text,
  bio text,
  avatar_url text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT USING (is_public = true);
CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ READING STREAKS ============
CREATE TABLE public.reading_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_read_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.reading_streaks TO authenticated;
GRANT ALL ON public.reading_streaks TO service_role;

ALTER TABLE public.reading_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own streak" ON public.reading_streaks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all streaks" ON public.reading_streaks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_reading_streaks_updated_at BEFORE UPDATE ON public.reading_streaks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ REPORTS ============
CREATE TABLE public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT report_target_present CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

GRANT SELECT, INSERT ON public.post_reports TO authenticated;
GRANT UPDATE, DELETE ON public.post_reports TO authenticated;
GRANT ALL ON public.post_reports TO service_role;

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own reports" ON public.post_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id AND length(reason) > 0);
CREATE POLICY "Users read own reports" ON public.post_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Admins read reports" ON public.post_reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update reports" ON public.post_reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete reports" ON public.post_reports
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_post_reports_updated_at BEFORE UPDATE ON public.post_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ POSTS: SCHEDULING + SEARCH ============
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS publish_at timestamptz;

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(description,'')), 'B') ||
  setweight(to_tsvector('english', coalesce(content,'')), 'C')
) STORED;

CREATE INDEX IF NOT EXISTS posts_search_vector_idx ON public.posts USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS posts_publish_at_idx ON public.posts (publish_at) WHERE published = false;

-- ============ PROFILE AUTO-CREATE ============
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_handle text;
  final_handle text;
  n integer := 0;
BEGIN
  base_handle := regexp_replace(lower(split_part(coalesce(NEW.email, 'user'), '@', 1)), '[^a-z0-9_]', '', 'g');
  IF base_handle = '' THEN base_handle := 'user'; END IF;
  final_handle := base_handle;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE handle = final_handle) LOOP
    n := n + 1;
    final_handle := base_handle || n::text;
  END LOOP;

  INSERT INTO public.profiles (id, handle, display_name)
  VALUES (NEW.id, final_handle, coalesce(NEW.raw_user_meta_data->>'full_name', base_handle))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.reading_streaks (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill existing users
INSERT INTO public.profiles (id, handle, display_name)
SELECT u.id,
       regexp_replace(lower(split_part(coalesce(u.email,'user'), '@', 1)), '[^a-z0-9_]', '', 'g') || '_' || substr(u.id::text, 1, 4),
       regexp_replace(lower(split_part(coalesce(u.email,'user'), '@', 1)), '[^a-z0-9_]', '', 'g')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reading_streaks (user_id)
SELECT id FROM auth.users ON CONFLICT (user_id) DO NOTHING;

-- ============ RPCs ============
CREATE OR REPLACE FUNCTION public.record_read()
RETURNS public.reading_streaks
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  rec public.reading_streaks;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  INSERT INTO public.reading_streaks (user_id, current_streak, longest_streak, last_read_date)
  VALUES (uid, 1, 1, current_date)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE
      WHEN public.reading_streaks.last_read_date = current_date THEN public.reading_streaks.current_streak
      WHEN public.reading_streaks.last_read_date = current_date - 1 THEN public.reading_streaks.current_streak + 1
      ELSE 1 END,
    last_read_date = current_date,
    updated_at = now()
  RETURNING * INTO rec;

  UPDATE public.reading_streaks
  SET longest_streak = GREATEST(longest_streak, current_streak)
  WHERE user_id = uid
  RETURNING * INTO rec;

  RETURN rec;
END; $$;

REVOKE EXECUTE ON FUNCTION public.record_read() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_read() TO authenticated;

CREATE OR REPLACE FUNCTION public.search_posts(
  q text DEFAULT '',
  p_category text DEFAULT NULL,
  p_news_category text DEFAULT NULL,
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 30,
  p_offset integer DEFAULT 0
)
RETURNS SETOF public.posts
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM public.posts p
  WHERE p.published = true
    AND (q IS NULL OR q = '' OR p.search_vector @@ websearch_to_tsquery('english', q))
    AND (p_category IS NULL OR p.category = p_category)
    AND (p_news_category IS NULL OR p.news_category = p_news_category)
    AND (p_from IS NULL OR p.created_at >= p_from)
    AND (p_to IS NULL OR p.created_at <= p_to)
  ORDER BY
    CASE WHEN q IS NULL OR q = '' THEN 0
         ELSE ts_rank(p.search_vector, websearch_to_tsquery('english', q)) END DESC,
    p.created_at DESC
  LIMIT LEAST(coalesce(p_limit, 30), 100) OFFSET coalesce(p_offset, 0);
$$;

REVOKE EXECUTE ON FUNCTION public.search_posts(text, text, text, timestamptz, timestamptz, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_posts(text, text, text, timestamptz, timestamptz, integer, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.trending_tags(p_days integer DEFAULT 14, p_limit integer DEFAULT 30)
RETURNS TABLE (tag text, uses bigint, score numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.tag,
         count(*)::bigint AS uses,
         (count(*) + coalesce(sum(p.likes_count), 0) * 0.5 + coalesce(sum(p.views), 0) * 0.05)::numeric AS score
  FROM public.posts p
  CROSS JOIN LATERAL unnest(coalesce(p.tags, '{}'::text[])) AS t(tag)
  WHERE p.published = true
    AND p.created_at >= now() - (coalesce(p_days, 14) || ' days')::interval
    AND length(trim(t.tag)) > 0
  GROUP BY t.tag
  ORDER BY score DESC
  LIMIT LEAST(coalesce(p_limit, 30), 100);
$$;

REVOKE EXECUTE ON FUNCTION public.trending_tags(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trending_tags(integer, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.publish_due_posts()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE public.posts
  SET published = true, status = 'published', publish_at = NULL
  WHERE published = false AND publish_at IS NOT NULL AND publish_at <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END; $$;

REVOKE EXECUTE ON FUNCTION public.publish_due_posts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_due_posts() TO service_role;

CREATE OR REPLACE FUNCTION public.public_profile_stats(p_user_id uuid)
RETURNS TABLE (bookmark_count bigint, reaction_count bigint, comment_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM public.bookmarks b WHERE b.user_id = p_user_id),
    (SELECT count(*) FROM public.likes l WHERE l.user_id = p_user_id),
    (SELECT count(*) FROM public.comments c WHERE c.user_id = p_user_id)
  WHERE EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p_user_id AND (pr.is_public = true OR pr.id = auth.uid()));
$$;

REVOKE EXECUTE ON FUNCTION public.public_profile_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_profile_stats(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.public_profile_activity(p_user_id uuid, p_limit integer DEFAULT 12)
RETURNS SETOF public.posts
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT ON (p.id) p.*
  FROM public.posts p
  WHERE p.published = true
    AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p_user_id AND (pr.is_public = true OR pr.id = auth.uid()))
    AND (
      EXISTS (SELECT 1 FROM public.bookmarks b WHERE b.post_id = p.id AND b.user_id = p_user_id)
      OR EXISTS (SELECT 1 FROM public.likes l WHERE l.post_id = p.id AND l.user_id = p_user_id)
    )
  ORDER BY p.id, p.created_at DESC
  LIMIT LEAST(coalesce(p_limit, 12), 50);
$$;

REVOKE EXECUTE ON FUNCTION public.public_profile_activity(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_profile_activity(uuid, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.user_taste(p_user_id uuid)
RETURNS TABLE (category text, weight bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.category, count(*)::bigint AS weight
  FROM public.posts p
  WHERE p.id IN (
      SELECT post_id FROM public.bookmarks WHERE user_id = p_user_id
      UNION ALL
      SELECT post_id FROM public.likes WHERE user_id = p_user_id
    )
    AND p_user_id = auth.uid()
  GROUP BY p.category
  ORDER BY weight DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.user_taste(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_taste(uuid) TO authenticated;