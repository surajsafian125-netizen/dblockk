ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'D''Block Update',
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS link text,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Anyone can read notifications" ON public.notifications;
CREATE POLICY "Users read own or broadcast notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users mark own notifications read" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.push_preferences (
  user_id uuid PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  permission text NOT NULL DEFAULT 'default',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_preferences TO authenticated;
GRANT ALL ON public.push_preferences TO service_role;
ALTER TABLE public.push_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push prefs" ON public.push_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read push prefs" ON public.push_preferences
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER update_push_preferences_updated_at BEFORE UPDATE ON public.push_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();