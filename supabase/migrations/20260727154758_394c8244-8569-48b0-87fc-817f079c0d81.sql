
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS news_category text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

-- Backfill status from existing published flag
UPDATE public.posts SET status = 'published' WHERE published = true AND status = 'draft';

-- Backfill news_category for previously imported global news
UPDATE public.posts SET news_category = 'global'
  WHERE news_category IS NULL AND tags && ARRAY['imported','global-news']::text[];

ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check CHECK (status IN ('draft','published')),
  ADD CONSTRAINT posts_news_category_check CHECK (news_category IS NULL OR news_category IN ('global','local'));

CREATE INDEX IF NOT EXISTS posts_status_news_category_idx ON public.posts (status, news_category);
