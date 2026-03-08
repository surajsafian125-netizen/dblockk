import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import AuthModal from './AuthModal';
import NotificationBell from './NotificationBell';
import MarqueeTicker from './MarqueeTicker';
import MyStash from './MyStash';
import PostDetailModal from './PostDetailModal';
import { useBookmarks } from '@/hooks/useBookmarks';
import type { PostDisplay } from './ContentGrid';

const Header = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);
  const [stashOpen, setStashOpen] = useState(false);
  const [stashPost, setStashPost] = useState<PostDisplay | null>(null);
  const { bookmarkedIds, bookmarkedPosts, toggleBookmark, loading: stashLoading } = useBookmarks();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setAuthModal(detail);
    };
    window.addEventListener('open-auth', handler);
    return () => window.removeEventListener('open-auth', handler);
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 glass"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold">
            <span className="text-primary text-glow">D'Block</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/hustle-board" className="text-sm text-muted-foreground hover:text-primary transition-colors hidden sm:inline">
              Hustle Board
            </Link>
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStashOpen(true)}
                  className="relative glass rounded-lg p-2 glass-hover transition-all"
                  title="My Stash"
                >
                  <Bookmark className="h-4 w-4" />
                  {bookmarkedPosts.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                      {bookmarkedPosts.length}
                    </span>
                  )}
                </motion.button>
                {isAdmin && (
                  <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Admin
                  </Link>
                )}
                <span className="text-sm text-muted-foreground hidden sm:inline">{displayName}</span>
                <button
                  onClick={() => logout()}
                  className="glass rounded-lg px-3 py-1.5 text-sm glass-hover transition-all"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAuthModal('login')}
                  className="glass rounded-lg px-4 py-1.5 text-sm glass-hover transition-all"
                >
                  Log In
                </button>
                <button
                  onClick={() => setAuthModal('signup')}
                  className="bg-primary text-primary-foreground rounded-lg px-4 py-1.5 text-sm hover:opacity-90 transition-all glow"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </motion.header>
      <MarqueeTicker />
      <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onSwitch={setAuthModal} />
      <MyStash
        open={stashOpen}
        onClose={() => setStashOpen(false)}
        posts={bookmarkedPosts}
        loading={stashLoading}
        onRemove={toggleBookmark}
        onSelect={(post) => setStashPost(post)}
      />
      <PostDetailModal
        post={stashPost}
        onClose={() => setStashPost(null)}
        isBookmarked={stashPost ? bookmarkedIds.has(stashPost.id) : false}
        onToggleBookmark={toggleBookmark}
      />
    </>
  );
};

export default Header;
