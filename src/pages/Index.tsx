import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ContentGrid from '@/components/ContentGrid';
import GlobalTrends from '@/components/GlobalTrends';
import DailyTechLaunches from '@/components/DailyTechLaunches';
import TechCategoryGrowth from '@/components/TechCategoryGrowth';
import MatchDay from '@/components/MatchDay';
import PodcastCreatorChart from '@/components/PodcastCreatorChart';
import GeoIntelligenceHub from '@/components/GeoIntelligenceHub';
import CultureEntertainmentFeed from '@/components/CultureEntertainmentFeed';
import FloatingActionButton from '@/components/FloatingActionButton';
import ParticleBackground from '@/components/ParticleBackground';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen gradient-bg relative overflow-x-hidden">
      <ParticleBackground />
      <Header />
      <div className="relative z-10">
        <Hero />
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ContentGrid />

            {/* Intelligence & Culture Hub */}
            <section className="container mx-auto px-4 py-16">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-display text-3xl font-bold mb-8 text-center"
              >
                Intelligence & Culture <span className="text-primary text-glow">Hub</span>
              </motion.h2>

              {/* Tech & Trends group */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <GlobalTrends />
                <DailyTechLaunches />
                <TechCategoryGrowth />
              </div>

              {/* Sports & Culture group */}
              <div className="grid md:grid-cols-2 gap-6">
                <MatchDay />
                <PodcastCreatorChart />
              </div>

            </section>

            {/* Culture & Entertainment Feed */}
            <CultureEntertainmentFeed />

            {/* Geo-Intelligence Hub */}
            <GeoIntelligenceHub />
          </motion.div>
        )}
        <ContactSection />
      </div>
      <Footer />
      <FloatingActionButton />
    </div>
  );
};

export default Index;
