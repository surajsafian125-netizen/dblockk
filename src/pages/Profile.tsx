import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Bookmark, Heart, MessageCircle, Flame, Pencil, Check, X, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ContentCard from '@/components/ContentCard';
import PostDetailModal from '@/components/PostDetailModal';
import { SkeletonGrid } from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useProfile, type Profile as ProfileRow } from '@/hooks/useProfile';
import { mapPost } from '@/lib/mapPost';
import type { PostDisplay } from '@/components/ContentGrid';

const Profile = () => {
  const { handle } = useParams<{ handle: string }>();
  const { user } = useAuth();
  const { streak, updateProfile } = useProfile();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stats, setStats] = useState({ bookmark_count: 0, reaction_count: 0, comment_count: 0 });
  const [activity, setActivity] = useState<PostDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PostDisplay | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display_name: '', bio: '', is_public: true });

  const isOwner = !!user && !!profile && user.id === profile.id;

  const load = useCallback(async () => {
    if (!handle) return;
    setLoading(true);
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('handle', handle)
      .maybeSingle();

    if (!p) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setProfile(p as ProfileRow);
    setForm({
      display_name: (p as ProfileRow).display_name || '',
      bio: (p as ProfileRow).bio || '',
      is_public: (p as ProfileRow).is_public,
    });

    const [{ data: s }, { data: acts }] = await Promise.all([
      supabase.rpc('public_profile_stats', { p_user_id: p.id }),
      supabase.rpc('public_profile_activity', { p_user_id: p.id, p_limit: 12 }),
    ]);
    if (s && (s as any[])[0]) setStats((s as any[])[0]);
    setActivity(((acts as any[]) || []).map(mapPost));
    setLoading(false);
  }, [handle]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const res = await updateProfile(form);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success('Profile updated');
    setEditing(false);
    load();
  };

  const joined = profile
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen gradient-bg relative overflow-x-hidden">
      <Header />
      <main className="relative z-10 container mx-auto px-4 pt-28 pb-16">
        {loading ? (
          <div className="space-y-6">
            <div className="h-40 rounded-2xl glass animate-pulse" />
            <SkeletonGrid count={3} />
          </div>
        ) : !profile ? (
          <EmptyState
            icon={<Lock className="h-6 w-6" />}
            title="Profile not available"
            description="This profile doesn't exist or has been set to private."
            action={
              <Link to="/" className="rounded-xl glass glass-hover px-4 py-2 text-xs font-medium text-primary">
                Back to feed
              </Link>
            }
          />
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-strong rounded-2xl p-6 sm:p-8 mb-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="h-20 w-20 shrink-0 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-display text-2xl font-bold">
                  {(profile.display_name || profile.handle).slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  {editing ? (
                    <div className="space-y-2">
                      <input
                        value={form.display_name}
                        onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                        placeholder="Display name"
                        className="w-full rounded-xl glass px-3 py-2 text-sm bg-transparent outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <textarea
                        value={form.bio}
                        onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                        placeholder="Short bio"
                        rows={2}
                        className="w-full rounded-xl glass px-3 py-2 text-sm bg-transparent outline-none resize-none focus:ring-1 focus:ring-primary/30"
                      />
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={form.is_public}
                          onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                          className="accent-primary"
                        />
                        Public profile — anyone can view this page
                      </label>
                    </div>
                  ) : (
                    <>
                      <h1 className="font-display text-2xl font-bold truncate">
                        {profile.display_name || profile.handle}
                      </h1>
                      <p className="text-sm text-muted-foreground">@{profile.handle}</p>
                      {profile.bio && <p className="text-sm mt-2 max-w-xl">{profile.bio}</p>}
                    </>
                  )}

                  <div className="flex items-center gap-3 mt-3 flex-wrap text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> Joined {joined}
                    </span>
                    <span className="flex items-center gap-1">
                      {profile.is_public ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      {profile.is_public ? 'Public' : 'Private'}
                    </span>
                    {isOwner && streak && (
                      <span className="flex items-center gap-1 text-primary">
                        <Flame className="h-3.5 w-3.5" /> {streak.current_streak}-day streak · longest{' '}
                        {streak.longest_streak}
                      </span>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <div className="flex items-center gap-2 shrink-0">
                    {editing ? (
                      <>
                        <button
                          onClick={save}
                          className="rounded-xl bg-primary text-primary-foreground px-3 py-2 text-xs font-medium flex items-center gap-1"
                        >
                          <Check className="h-3.5 w-3.5" /> Save
                        </button>
                        <button
                          onClick={() => setEditing(false)}
                          className="rounded-xl glass glass-hover px-3 py-2 text-xs flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditing(true)}
                        className="rounded-xl glass glass-hover px-3 py-2 text-xs flex items-center gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit profile
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { label: 'Stashed', value: stats.bookmark_count, icon: Bookmark },
                  { label: 'Reactions', value: stats.reaction_count, icon: Heart },
                  { label: 'Comments', value: stats.comment_count, icon: MessageCircle },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-3 text-center">
                    <s.icon className="h-4 w-4 mx-auto text-primary mb-1" />
                    <p className="font-display text-lg font-bold">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            <h2 className="font-display text-xl font-bold mb-4">Activity</h2>
            {activity.length === 0 ? (
              <EmptyState
                icon={<Bookmark className="h-6 w-6" />}
                title="Nothing public yet"
                description="Stashed and reacted articles will show up here."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activity.map((post, i) => (
                  <ContentCard
                    key={post.id}
                    post={post}
                    index={i}
                    onClick={() => setSelected(post)}
                    isBookmarked={bookmarkedIds.has(post.id)}
                    onToggleBookmark={toggleBookmark}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <PostDetailModal
        post={selected}
        onClose={() => setSelected(null)}
        isBookmarked={selected ? bookmarkedIds.has(selected.id) : false}
        onToggleBookmark={toggleBookmark}
      />
      <Footer />
    </div>
  );
};

export default Profile;
