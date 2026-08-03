import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import ParticleBackground from './ParticleBackground';
import loginWallpaper from '@/assets/login-wallpaper.jpeg.asset.json';

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      const t = setTimeout(
        () => window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' })),
        50
      );
      return () => clearTimeout(t);
    }
  }, [isAuthenticated]);

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="min-h-screen gradient-bg relative overflow-x-hidden">
      <img
        src={loginWallpaper.url}
        alt=""
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none z-0"
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'linear-gradient(to bottom, hsl(var(--background) / 0.45), hsl(var(--background) / 0.7))' }}
      />
      <ParticleBackground />
      <Header />
    </div>
  );
};

export default ProtectedRoute;
