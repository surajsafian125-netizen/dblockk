
-- Create trigger function to auto-assign roles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign admin role if email matches
  IF NEW.email = 'surajmohammed129@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  -- Always assign user role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update posts RLS policies to allow admin inserts/updates/deletes properly
DROP POLICY IF EXISTS "Admin delete" ON public.posts;
DROP POLICY IF EXISTS "Admin insert" ON public.posts;
DROP POLICY IF EXISTS "Admin update" ON public.posts;

CREATE POLICY "Admin delete posts" ON public.posts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert posts" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update posts" ON public.posts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix analytics_settings RLS - only admin can write
DROP POLICY IF EXISTS "Admin update analytics" ON public.analytics_settings;
DROP POLICY IF EXISTS "Admin insert analytics" ON public.analytics_settings;

CREATE POLICY "Admin update analytics" ON public.analytics_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert analytics" ON public.analytics_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
