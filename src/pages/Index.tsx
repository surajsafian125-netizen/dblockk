import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ContentGrid from '@/components/ContentGrid';
import PodcastCreatorChart from '@/components/PodcastCreatorChart';
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

            {/* Audio Vault & Culture */}
            <section className="container mx-auto px-4 py-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-display text-3xl font-bold mb-8 text-center"
              >
                Audio Vault & <span className="text-primary text-glow">Culture</span>
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PodcastCreatorChart />
                <CultureEntertainmentFeed />
              </div>
            </section>
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
