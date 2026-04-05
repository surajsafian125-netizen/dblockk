import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Bookmark, Menu, X, Activity, Home, Newspaper, LayoutDashboard, Shield } from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const { bookmarkedIds, bookmarkedPosts, toggleBookmark, loading: stashLoading } = useBookmarks();
  const location = useLocation();

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setAuthModal(detail);
    };
    window.addEventListener('open-auth', handler);
    return () => window.removeEventListener('open-auth', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-mobile-menu]') && !target.closest('[data-hamburger]')) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [mobileOpen]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  const navLinks = [
    { to: '/', label: 'Home', icon: Home, show: true },
    { to: '/hustle-board', label: 'Hustle Board', icon: Newspaper, show: true },
    { to: '/pulse', label: 'Pulse Hub', icon: Activity, show: isAuthenticated },
    { to: '/admin', label: 'Admin', icon: Shield, show: isAuthenticated && isAdmin },
  ];

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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.filter(l => l.show).map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors flex items-center gap-1.5 ${
                  location.pathname === link.to
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
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
                <span className="text-sm text-muted-foreground">{displayName}</span>
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

          {/* Mobile: minimal actions + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            {isAuthenticated && <NotificationBell />}
            <button
              data-hamburger
              onClick={() => setMobileOpen(prev => !prev)}
              className="glass rounded-lg p-2 glass-hover transition-all"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            data-mobile-menu
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="fixed top-16 left-0 right-0 z-40 glass-strong glow border-b border-border/20 md:hidden"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.filter(l => l.show).map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === link.to
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}

              {isAuthenticated && (
                <button
                  onClick={() => { setStashOpen(true); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all"
                >
                  <Bookmark className="h-4 w-4" />
                  My Stash
                  {bookmarkedPosts.length > 0 && (
                    <span className="ml-auto h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                      {bookmarkedPosts.length}
                    </span>
                  )}
                </button>
              )}

              <div className="border-t border-border/20 mt-2 pt-3 px-4">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{displayName}</span>
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="glass rounded-lg px-4 py-1.5 text-sm glass-hover transition-all"
                    >
                      Log Out
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setAuthModal('login'); setMobileOpen(false); }}
                      className="flex-1 glass rounded-xl py-2.5 text-sm text-center glass-hover transition-all"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => { setAuthModal('signup'); setMobileOpen(false); }}
                      className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm text-center hover:opacity-90 transition-all glow"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

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
