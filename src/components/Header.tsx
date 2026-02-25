import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import AuthModal from './AuthModal';

const Header = () => {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [authModal, setAuthModal] = useState<'login' | 'signup' | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setAuthModal(detail);
    };
    window.addEventListener('open-auth', handler);
    return () => window.removeEventListener('open-auth', handler);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 glass"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold">
            <span className="text-primary text-glow">PULSE</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Admin
                  </Link>
                )}
                <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
                <button
                  onClick={logout}
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
      <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onSwitch={setAuthModal} />
    </>
  );
};

export default Header;