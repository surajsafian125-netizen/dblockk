import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ContentGrid from '@/components/ContentGrid';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import ProjectEstimator from '@/components/ProjectEstimator';
import FloatingActionButton from '@/components/FloatingActionButton';
import ParticleBackground from '@/components/ParticleBackground';

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen gradient-bg relative">
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
            <AnalyticsDashboard />
            <ProjectEstimator />
          </motion.div>
        )}
      </div>
      <FloatingActionButton />
    </div>
  );
};

export default Index;