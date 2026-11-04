import { supabase } from '@/integrations/supabase/client';

export type GoogleSignInResult = { error?: string };

/**
 * Reusable Google OAuth sign-in. Redirects to Google, then back to `redirectTo`.
 */
export async function signInWithGoogle(
  redirectTo = `${window.location.origin}/`,
): Promise<GoogleSignInResult> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error) return { error: error.message };
  return {};
}
