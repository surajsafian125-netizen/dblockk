import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff, Sparkles, ArrowRight, Loader2, ShieldCheck, Zap, Globe2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import loginWallpaper from '@/assets/login-wallpaper.jpeg.asset.json';


interface AuthModalProps {
  mode: 'login' | 'signup' | null;
  onClose: () => void;
  onSwitch: (mode: 'login' | 'signup') => void;
}

const AuthModal = ({ mode, onClose, onSwitch }: AuthModalProps) => {
  const { login, signup, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    if (result.error) {
      toast.error(result.error);
      setGoogleLoading(false);
    }
  };

  if (!mode) return null;

  const isSignup = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (result.error) return toast.error(result.error);
        toast.success('Welcome back!');
      } else {
        const result = await signup(name, email, password);
        if (result.error) return toast.error(result.error);
        toast.success('Account created! Check your email to confirm.');
      }
      onClose();
      setName(''); setEmail(''); setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"
        onClick={onClose}
      >
        {/* Full-screen wallpaper backdrop */}
        <img
          src={loginWallpaper.url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'hsl(var(--background) / 0.55)', backdropFilter: 'blur(4px)' }}
        />

        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-strong glow rounded-3xl w-full max-w-4xl overflow-hidden grid md:grid-cols-[1.05fr_1fr] shadow-2xl relative"
        >
          {/* Left: brand panel (hidden on mobile) */}
          <div className="hidden md:flex relative flex-col justify-between p-10 overflow-hidden">
            <img
              src={loginWallpaper.url}
              alt="Floodlit pitch at night"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/60 to-primary/30" />
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />


            <div className="relative">
              <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-[11px] text-primary mb-6">
                <Sparkles className="h-3 w-3" /> D'Block Members
              </div>
              <h2 className="font-display text-4xl font-bold leading-tight mb-3 bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
                {isSignup ? 'Join the frontier.' : 'Welcome back.'}
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                {isSignup
                  ? 'Unfiltered intel, community drops, and AI-powered discovery — built for the ones building next.'
                  : 'Your daily edge is one login away. Live intel, community, and AI at your fingertips.'}
              </p>
            </div>

            <div className="relative space-y-3 mt-10">
              {[
                { icon: Zap, label: 'Real-time news & AI-crafted stories' },
                { icon: Globe2, label: 'Live sports, crypto, and global pulse' },
                { icon: ShieldCheck, label: 'Private, secure, and ad-free' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  className="flex items-center gap-3 glass rounded-xl px-3 py-2.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-foreground/80">{f.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="relative p-6 sm:p-10">
            {/* Mobile wallpaper backdrop */}
            <img
              src={loginWallpaper.url}
              alt=""
              aria-hidden="true"
              className="md:hidden absolute inset-0 w-full h-full object-cover"
            />
            <div className="md:hidden absolute inset-0 bg-background/70 backdrop-blur-sm" />
            <div className="relative">

            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 glass rounded-full p-2 text-muted-foreground hover:text-foreground glass-hover transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6">
              <h3 className="font-display text-2xl font-bold mb-1">
                {isSignup ? 'Create your account' : 'Log in to D\u2019Block'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isSignup ? 'Free forever. No card required.' : 'Enter your details to continue.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-[#1f1f1f] border border-[#dadce0] py-3 text-sm font-medium hover:bg-[#f7f8f8] active:bg-[#f1f3f4] transition-colors disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-[18px] w-[18px]" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.28-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-5">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSignup && (
                <Field icon={<UserIcon className="h-4 w-4" />} label="Full name">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full bg-transparent focus:outline-none text-sm placeholder:text-muted-foreground/60"
                    placeholder="Your name"
                  />
                </Field>
              )}

              <Field icon={<Mail className="h-4 w-4" />} label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-transparent focus:outline-none text-sm placeholder:text-muted-foreground/60"
                  placeholder="you@domain.com"
                />
              </Field>

              <Field icon={<Lock className="h-4 w-4" />} label="Password">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  className="w-full bg-transparent focus:outline-none text-sm placeholder:text-muted-foreground/60"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:opacity-90 transition-all glow disabled:opacity-50 inline-flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isSignup ? 'Create account' : 'Log in'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <button
                onClick={() => onSwitch(isSignup ? 'login' : 'signup')}
                className="text-primary hover:underline font-medium"
              >
                {isSignup ? 'Log in' : 'Sign up'}
              </button>
            </p>

            <p className="text-[10px] text-center text-muted-foreground/70 mt-4 leading-relaxed">
              By continuing you agree to D'Block's Terms & Privacy Policy.
            </p>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Field = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
      {label}
    </span>
    <div className="flex items-center gap-3 glass rounded-xl px-3.5 py-3 focus-within:ring-1 focus-within:ring-primary/60 transition-all">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      {children}
    </div>
  </label>
);

export default AuthModal;
