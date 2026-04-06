-- Add admin-only INSERT/DELETE policies to user_roles for defense-in-depth
CREATE POLICY "Admin insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add UPDATE policy to post-media storage bucket (admin-only)
CREATE POLICY "Admin update media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'post-media' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'post-media' AND public.has_role(auth.uid(), 'admin'));