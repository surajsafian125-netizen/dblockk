-- Fix 1: Remove user_email column from comments to prevent public email harvesting
ALTER TABLE public.comments DROP COLUMN IF EXISTS user_email;

-- Fix 2: Tighten user_roles SELECT policy to explicitly require authentication
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));