import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/Header';
import ParticleBackground from '@/components/ParticleBackground';
import Footer from '@/components/Footer';
import BreakingNewsTicker from '@/components/pulse/BreakingNewsTicker';
import CryptoTerminal from '@/components/pulse/CryptoTerminal';
import GlobalHubs from '@/components/pulse/GlobalHubs';
import ProMatchCenter from '@/components/pulse/ProMatchCenter';
import CosmicCommand from '@/components/pulse/CosmicCommand';
import MatchDay from '@/components/MatchDay';
import GeoIntelligenceHub from '@/components/GeoIntelligenceHub';
import GlobalTrends from '@/components/GlobalTrends';
import DailyTechLaunches from '@/components/DailyTechLaunches';
import TechCategoryGrowth from '@/components/TechCategoryGrowth';
import LocalPulse from '@/components/LocalPulse';
import { Activity } from 'lucide-react';

const PulseDashboard = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/');
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-x-hidden">
      <ParticleBackground />
      <Header />

      {/* Breaking News Ticker — right below header */}
      <div className="relative z-40 mt-16">
        <BreakingNewsTicker />
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-3 mb-2 glass glow rounded-2xl px-5 py-3">
            <Activity className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl font-bold">
              Pulse <span className="text-primary text-glow">Hub</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl mt-3 ml-1">
            Live sports scores, weather intelligence, crypto markets, tech trends — all your real-time data in one place.
          </p>
        </motion.div>

        {/* Daily Tech Launches */}
        <section className="mb-10">
          <div className="glass glow rounded-full px-4 py-2 inline-flex items-center gap-2 mb-5">
            <span className="text-lg">🚀</span>
            <h2 className="font-display text-xl font-semibold">Daily Tech Launches</h2>
          </div>
          <DailyTechLaunches />
        </section>

        {/* Tech & Trends */}
        <section className="mb-10">
          <div className="glass glow rounded-full px-4 py-2 inline-flex items-center gap-2 mb-5">
            <span className="text-lg">📊</span>
            <h2 className="font-display text-xl font-semibold">Tech & Trends</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlobalTrends />
            <TechCategoryGrowth />
          </div>
        </section>

        {/* Local Pulse */}
        <section className="mb-10">
          <LocalPulse />
        </section>

        {/* Crypto Terminal */}
        <section className="mb-10">
          <div className="glass glow rounded-full px-4 py-2 inline-flex items-center gap-2 mb-5">
            <span className="text-lg">💰</span>
            <h2 className="font-display text-xl font-semibold">Crypto Terminal</h2>
          </div>
          <CryptoTerminal />
        </section>

        {/* Live Sports — Pro Match Center */}
        <section className="mb-10">
          <ProMatchCenter />
        </section>

        {/* Cosmic Command — NASA APOD */}
        <section className="mb-10">
          <div className="glass glow rounded-full px-4 py-2 inline-flex items-center gap-2 mb-5">
            <span className="text-lg">🌌</span>
            <h2 className="font-display text-xl font-semibold">Cosmic Command</h2>
          </div>
          <CosmicCommand />
        </section>

        {/* Geo Intelligence Hub */}
        <section className="mb-10">
          <div className="glass glow rounded-full px-4 py-2 inline-flex items-center gap-2 mb-5">
            <span className="text-lg">🌐</span>
            <h2 className="font-display text-xl font-semibold">Geo Intelligence</h2>
          </div>
          <GeoIntelligenceHub />
        </section>

        {/* Global Hubs */}
        <section className="mb-10">
          <GlobalHubs />
        </section>

        {/* Match Day */}
        <section className="mb-10">
          <div className="glass glow rounded-full px-4 py-2 inline-flex items-center gap-2 mb-5">
            <span className="text-lg">🏟️</span>
            <h2 className="font-display text-xl font-semibold">Match Day</h2>
          </div>
          <MatchDay />
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default PulseDashboard;
