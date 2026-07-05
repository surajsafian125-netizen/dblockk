import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link as LinkIcon, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  title: string;
  description: string;
  postId: string;
  className?: string;
  compact?: boolean;
}

const ShareMenu = ({ title, description, postId, className = '', compact = true }: Props) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const url = `${window.location.origin}/?post=${postId}`;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy');
    }
    setOpen(false);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
      } catch (e: any) {
        if (e?.name !== 'AbortError') copy();
      }
    } else {
      copy();
    }
  };

  const links = [
    {
      label: 'Twitter / X',
      icon: <Twitter className="h-3.5 w-3.5" />,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: 'WhatsApp',
      icon: <MessageCircle className="h-3.5 w-3.5" />,
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
    {
      label: 'LinkedIn',
      icon: <Linkedin className="h-3.5 w-3.5" />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <div ref={ref} className={`relative ${className}`} onClick={stop}>
      <motion.button
        whileTap={{ scale: 1.15 }}
        onClick={(e) => {
          stop(e);
          if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
            share();
          } else {
            setOpen(o => !o);
          }
        }}
        className="hover:text-primary transition-colors flex items-center gap-1"
        title="Share"
      >
        <Share2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        {!compact && <span className="text-xs">Share</span>}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 bottom-full mb-2 z-30 min-w-[180px] glass glow rounded-xl border border-border/40 p-1.5 shadow-xl"
          >
            <button
              onClick={copy}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-primary/10 text-foreground transition-colors text-left"
            >
              <LinkIcon className="h-3.5 w-3.5 text-primary" /> Copy link
            </button>
            {links.map(l => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-primary/10 text-foreground transition-colors"
              >
                <span className="text-primary">{l.icon}</span> {l.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShareMenu;
