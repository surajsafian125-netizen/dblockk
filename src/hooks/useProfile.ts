import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_public: boolean;
  created_at: string;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null;
}

/** Current user's profile + reading streak. */
export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setStreak(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase
        .from('reading_streaks')
        .select('current_streak, longest_streak, last_read_date')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);
    setProfile((p as Profile) ?? null);
    setStreak((s as Streak) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<Profile, 'display_name' | 'bio' | 'handle' | 'is_public'>>) => {
      if (!user) return { error: 'Not signed in' };
      const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
      if (error) return { error: error.message };
      await load();
      return {};
    },
    [user, load]
  );

  return { profile, streak, loading, reload: load, updateProfile };
}

/** Records today's read once per session and returns the refreshed streak. */
export function useRecordStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    if (!user) {
      setStreak(null);
      return;
    }
    let cancelled = false;
    const key = `dblock-streak-${user.id}-${new Date().toISOString().slice(0, 10)}`;

    const run = async () => {
      if (sessionStorage.getItem(key) !== '1') {
        const { data, error } = await supabase.rpc('record_read');
        if (!error) sessionStorage.setItem(key, '1');
        if (!cancelled && data) {
          setStreak(data as unknown as Streak);
          return;
        }
      }
      const { data } = await supabase
        .from('reading_streaks')
        .select('current_streak, longest_streak, last_read_date')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled) setStreak((data as Streak) ?? null);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return streak;
}
