import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import ParticleBackground from './ParticleBackground';
import Footer from './Footer';
import loginWallpaper from '@/assets/login-wallpaper.jpeg.asset.json';

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const ProtectedRoute = ({
  children,
  title = "Members Only",
  subtitle = "Sign in to unlock the full D'Block experience — live intel, community boards, and AI-powered discovery.",
}: Props) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <>{children}</>;

  const open = (mode: 'login' | 'signup') =>
    window.dispatchEvent(new CustomEvent('open-auth', { detail: mode }));

  return (
    <div className="min-h-screen gradient-bg relative overflow-x-hidden">
      <ParticleBackground />
      <Header />
      <main className="relative z-10 flex items-center justify-center min-h-[100vh] px-4 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-strong glow rounded-3xl p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden"
        >
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

          <div className="relative">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-6 glow"
            >
              <Lock className="h-7 w-7 text-primary" />
            </motion.div>

            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-[11px] text-primary mb-4">
              <Sparkles className="h-3 w-3" /> Authentication Required
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">{subtitle}</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => open('signup')}
                className="flex-1 bg-primary text-primary-foreground rounded-xl px-6 py-3 font-medium hover:opacity-90 transition-all glow inline-flex items-center justify-center gap-2"
              >
                Create Account <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => open('login')}
                className="flex-1 glass glass-hover rounded-xl px-6 py-3 font-medium transition-all"
              >
                Log In
              </button>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ProtectedRoute;
