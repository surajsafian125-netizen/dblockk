
-- Add columns to posts table for full content management
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reading_time integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS engagement_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS published boolean DEFAULT true;

-- Create analytics_settings table for admin-controlled analytics
CREATE TABLE IF NOT EXISTS public.analytics_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_views text DEFAULT '0',
  total_users text DEFAULT '0',
  engagement_rate text DEFAULT '0%',
  growth text DEFAULT '0%',
  views_change text DEFAULT '+0%',
  users_change text DEFAULT '+0%',
  engagement_change text DEFAULT '+0%',
  growth_change text DEFAULT '+0%',
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS for analytics_settings - public read, admin write handled in app
ALTER TABLE public.analytics_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read analytics" ON public.analytics_settings
  FOR SELECT USING (true);

CREATE POLICY "Admin update analytics" ON public.analytics_settings
  FOR UPDATE USING (true);

CREATE POLICY "Admin insert analytics" ON public.analytics_settings
  FOR INSERT WITH CHECK (true);

-- Insert default row
INSERT INTO public.analytics_settings (total_views, total_users, engagement_rate, growth)
VALUES ('124.5K', '8,432', '78.3%', '+23%');

-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true);

-- Storage policies for post-media bucket
CREATE POLICY "Public read post media" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-media');

CREATE POLICY "Auth upload post media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'post-media' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete post media" ON storage.objects
  FOR DELETE USING (bucket_id = 'post-media' AND auth.role() = 'authenticated');
