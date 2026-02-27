-- Fix 1: Create admin config table for admin email (removes hardcoding from function)
CREATE TABLE IF NOT EXISTS public.admin_config (
  key text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/modify config
CREATE POLICY "Admin read config" ON public.admin_config
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update config" ON public.admin_config
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed the admin email
INSERT INTO public.admin_config (key, value) VALUES ('admin_email', 'surajmohammed129@gmail.com')
ON CONFLICT (key) DO NOTHING;

-- Update trigger to read from config table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_email text;
BEGIN
  SELECT value INTO admin_email FROM public.admin_config WHERE key = 'admin_email';
  IF admin_email IS NOT NULL AND NEW.email = admin_email THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix 2: Add missing comments UPDATE/DELETE policies
CREATE POLICY "Users update own comments" ON public.comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own comments" ON public.comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin moderate comments" ON public.comments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix 3: Tighten user_roles SELECT policy to require authenticated
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);