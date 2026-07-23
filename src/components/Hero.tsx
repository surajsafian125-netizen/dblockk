import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import GlassSearchBar from './GlassSearchBar';

const Hero = () => {
  const { isAuthenticated } = useAuth();

  const openSignup = () => {
    window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signup' }));
  };

  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 pt-28">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl mx-auto"
      >
        <motion.h1
          className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          D'Block.
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          The definitive source for unfiltered news, industry launches, and the conversations&nbsp;
        </motion.p>

        {isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <GlassSearchBar />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="glass glow rounded-2xl p-8 mt-4 max-w-md mx-auto text-center"
          >
            <p className="text-muted-foreground mb-5">
              Log in to explore content and unlock all features.
            </p>
            <button
              onClick={openSignup}
              className="bg-primary text-primary-foreground rounded-xl px-8 py-3 font-medium hover:opacity-90 transition-all glow"
            >
              Get Started
            </button>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};

export default Hero;
