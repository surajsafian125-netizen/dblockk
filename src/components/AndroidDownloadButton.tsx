import { Download, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export const APK_PATH = '/downloads/dblock.apk';
export const APK_FILENAME = 'dblock.apk';

interface AndroidDownloadButtonProps {
  className?: string;
  label?: string;
  /** 'primary' = filled button, 'ghost' = glass button */
  variant?: 'primary' | 'ghost';
}

const AndroidDownloadButton = ({
  className = '',
  label = 'Download for Android',
  variant = 'primary',
}: AndroidDownloadButtonProps) => {
  const content = (
    <>
      <Smartphone className="h-4 w-4" />
      <span>{label}</span>
      <Download className="h-4 w-4" />
    </>
  );

  const base = `inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all ${className}`;
  const styles =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground px-5 py-2.5 hover:opacity-90 glow'
      : 'glass glass-hover px-5 py-2.5';

  return (
    <motion.a
      whileTap={{ scale: 0.96 }}
      href={APK_PATH}
      download={APK_FILENAME}
      className={`${base} ${styles}`}
      aria-label={label}
    >
      {content}
    </motion.a>
  );
};

export default AndroidDownloadButton;