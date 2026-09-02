import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const REASONS = ['Misinformation', 'Spam', 'Harassment', 'Offensive content', 'Copyright', 'Other'];

interface Props {
  postId?: string;
  commentId?: string;
  label?: string;
  className?: string;
}

const ReportButton = ({ postId, commentId, label, className = '' }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!user) {
      toast.error('Sign in to report content');
      return;
    }
    setSending(true);
    const { error } = await supabase.from('post_reports').insert({
      reporter_id: user.id,
      post_id: postId ?? null,
      comment_id: commentId ?? null,
      reason,
      details: details.trim() || null,
    });
    setSending(false);
    if (error) {
      toast.error('Could not send report');
      return;
    }
    toast.success('Report sent to moderators');
    setOpen(false);
    setDetails('');
  };

  return (
    <>
      <button
        onClick={e => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="Report"
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors ${className}`}
      >
        <Flag className="h-3.5 w-3.5" />
        {label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-strong w-full max-w-md rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Flag className="h-4 w-4 text-destructive" /> Report content
                </h3>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {REASONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`rounded-full px-3 py-1 text-xs transition-all ${
                      reason === r
                        ? 'bg-primary/20 text-primary neon-border'
                        : 'glass glass-hover text-muted-foreground'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Add context (optional)"
                className="w-full rounded-xl glass px-3 py-2 text-sm bg-transparent outline-none resize-none focus:ring-1 focus:ring-primary/30"
              />

              <button
                disabled={sending}
                onClick={submit}
                className="mt-4 w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send report'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ReportButton;
