
-- 1) Extend likes with emoji reactions
ALTER TABLE public.likes ADD COLUMN IF NOT EXISTS emoji text NOT NULL DEFAULT 'like';
ALTER TABLE public.likes DROP CONSTRAINT IF EXISTS likes_post_id_user_id_key;
ALTER TABLE public.likes ADD CONSTRAINT likes_post_user_emoji_key UNIQUE (post_id, user_id, emoji);
CREATE INDEX IF NOT EXISTS likes_post_emoji_idx ON public.likes (post_id, emoji);

-- 2) Weekly digest subscribers
CREATE TABLE IF NOT EXISTS public.digest_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, DELETE ON public.digest_subscribers TO authenticated;
GRANT ALL ON public.digest_subscribers TO service_role;

ALTER TABLE public.digest_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own digest subscription"
  ON public.digest_subscribers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all digest subscribers"
  ON public.digest_subscribers
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
