import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  mode: 'login' | 'signup' | null;
  onClose: () => void;
  onSwitch: (mode: 'login' | 'signup') => void;
}

const AuthModal = ({ mode, onClose, onSwitch }: AuthModalProps) => {
  const { login, signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!mode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await signup(name, email, password);
      onClose();
      setName('');
      setEmail('');
      setPassword('');
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
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'hsl(var(--background) / 0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="glass-strong glow rounded-2xl p-8 w-full max-w-md mx-4"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-2xl font-bold">
              {mode === 'login' ? 'Welcome Back' : 'Join PULSE'}
            </h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm bg-secondary/50 border border-border focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm bg-secondary/50 border border-border focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm bg-secondary/50 border border-border focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:opacity-90 transition-all glow disabled:opacity-50"
            >
              {loading ? '...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => onSwitch(mode === 'login' ? 'signup' : 'login')}
              className="text-primary hover:underline"
            >
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;