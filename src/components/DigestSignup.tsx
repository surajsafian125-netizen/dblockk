import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DigestSignup = () => {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);


  useEffect(() => {
    if (!user) return;
    supabase
      .from('digest_subscribers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setSubscribed(!!data));
  }, [user]);

  const handle = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }));
      return;
    }
    if (!subscribed && !agreed) {
      toast.error('Please accept the Terms of Service & Privacy Policy first.');
      return;
    }
    setBusy(true);
    if (subscribed) {
      await supabase.from('digest_subscribers').delete().eq('user_id', user.id);
      setSubscribed(false);
      setAgreed(false);
      toast.success('Unsubscribed from the weekly digest');
    } else {
      const { error } = await supabase
        .from('digest_subscribers')
        .insert({ user_id: user.id, email: user.email ?? '' });
      if (error) {
        toast.error('Could not subscribe. Try again.');
      } else {
        setSubscribed(true);
        toast.success('You’re on the list — weekly digest incoming.');
      }
    }
    setBusy(false);
  };

  return (
    <div className="glass glow rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Mail className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-sm font-semibold">Weekly D'Block Digest</p>
        <p className="text-xs text-muted-foreground">
          The best hustles, drops and trends — once a week, straight to your inbox.
        </p>
        {!subscribed && (
          <label className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-border accent-primary"
            />
            <span>
              I agree to the{' '}
              <Link to="/legal" className="text-primary hover:underline">
                Terms of Service &amp; Privacy Policy
              </Link>
            </span>
          </label>
        )}
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handle}
        disabled={busy || (!subscribed && !agreed)}
        className={`rounded-xl px-4 py-2 text-xs font-medium inline-flex items-center gap-2 transition-all shrink-0 ${
          subscribed
            ? 'glass border border-primary/30 text-primary'
            : 'bg-primary text-primary-foreground glow'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : subscribed ? (
          <>
            <Check className="h-3.5 w-3.5" /> Subscribed
          </>
        ) : (
          'Get the Digest'
        )}
      </motion.button>
    </div>
  );

};

export default DigestSignup;
