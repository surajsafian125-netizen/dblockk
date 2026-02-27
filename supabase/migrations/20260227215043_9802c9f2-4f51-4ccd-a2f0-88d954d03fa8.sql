-- Fix 1: Add missing INSERT/DELETE policies for admin_config
CREATE POLICY "Admin insert config" ON public.admin_config
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete config" ON public.admin_config
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Ensure has_role function is in migrations for reproducibility
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;