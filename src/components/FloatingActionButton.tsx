import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bot, Mail, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AskAIDrawer from './AskAIDrawer';

const FloatingActionButton = () => {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const actions = [
    ...(isAdmin ? [{ icon: Plus, label: 'Create Post', onClick: () => navigate('/admin') }] : []),
    { icon: Bot, label: 'Ask AI', onClick: () => setAiOpen(true) },
    { icon: Mail, label: 'Contact', onClick: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3 items-end"
            >
              {actions.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    action.onClick();
                    setOpen(false);
                  }}
                  className="glass glow rounded-full px-4 py-2 flex items-center gap-2 text-sm whitespace-nowrap hover:scale-105 transition-transform"
                >
                  <action.icon className="h-4 w-4 text-primary" />
                  {action.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setOpen(!open)}
          className="bg-primary text-primary-foreground rounded-full p-4 glow-strong shadow-lg"
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
            {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
          </motion.div>
        </motion.button>
      </div>
      <AskAIDrawer open={aiOpen} onOpenChange={setAiOpen} />
    </>
  );
};

export default FloatingActionButton;
