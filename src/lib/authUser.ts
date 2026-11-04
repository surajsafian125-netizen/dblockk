import type { User } from '@supabase/supabase-js';

export function isEmailConfirmed(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.email_confirmed_at || user.confirmed_at) return true;
  const provider = user.app_metadata?.provider;
  return Boolean(provider && provider !== 'email');
}
