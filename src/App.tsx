import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { WallpaperProvider } from "@/contexts/WallpaperContext";
import { AnimatePresence, motion } from 'framer-motion';
import AppSplash from "@/components/AppSplash";
import LiveWallpaper from "@/components/LiveWallpaper";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import HustleBoard from "./pages/HustleBoard";
import PulseDashboard from "./pages/PulseDashboard";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AnimatePresence>
              {!splashDone && (
                <motion.div
                  key="splash"
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <AppSplash />
                </motion.div>
              )}
            </AnimatePresence>
            {splashDone && (
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<ProtectedRoute title="Welcome to D'Block" subtitle="Sign in to unlock the full feed — real-time news, AI stories, and community drops."><Index /></ProtectedRoute>} />
                  <Route path="/hustle-board" element={<ProtectedRoute title="Hustle & Collab" subtitle="Log in to browse remote gigs and post community opportunities."><HustleBoard /></ProtectedRoute>} />
                  <Route path="/pulse" element={<ProtectedRoute title="Pulse Hub" subtitle="Sign in to access live sports, crypto, and global intel."><PulseDashboard /></ProtectedRoute>} />
                  <Route path="/legal" element={<Legal />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            )}
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
