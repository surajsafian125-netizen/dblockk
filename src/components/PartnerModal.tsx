import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Send, Loader2, CheckCircle2, Building2, Mail, Briefcase, DollarSign, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { toast } from 'sonner';

const SERVICES = [
  'Website Creation',
  'PR Management',
  'Social Media Strategy',
  'Brand Identity & Design',
  'Content Production',
  'Digital Marketing',
  'Custom Software',
];

const BUDGETS = [
  'Under $500',
  '$500 – $1,000',
  '$1,000 – $3,000',
  '$3,000 – $5,000',
  '$5,000+',
  'Let\'s discuss',
];

const step1Schema = z.object({
  company_name: z.string().trim().min(1, 'Company name is required').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
});

const PartnerModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState('');
  const [budget, setBudget] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setStep(1);
    setCompanyName('');
    setEmail('');
    setService('');
    setBudget('');
    setDetails('');
    setDone(false);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      const result = step1Schema.safeParse({ company_name: companyName, email });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }
    }
    if (step === 2 && !service) {
      setError('Please select a service');
      return;
    }
    setStep(s => s + 1);
  };

  const submit = async () => {
    setError('');
    setSubmitting(true);
    const { error: dbError } = await supabase.from('client_leads').insert({
      company_name: companyName.trim(),
      email: email.trim(),
      service,
      budget_range: budget || null,
      project_details: details.trim() || null,
    });
    if (dbError) {
      setError('Submission failed. Please try again.');
      toast.error('Submission failed');
    } else {
      setDone(true);
      toast.success('Lead submitted!');
    }
    setSubmitting(false);
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map(s => (
        <div key={s} className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full transition-all ${s <= step ? 'bg-primary glow-strong' : 'bg-muted/40'}`} />
          {s < 3 && <div className={`w-8 h-0.5 rounded-full transition-all ${s < step ? 'bg-primary/60' : 'bg-muted/20'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-2xl border border-primary/10 bg-card/60 backdrop-blur-xl shadow-[0_0_60px_-10px_hsl(var(--primary)/0.15)] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-0 flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  Partner with <span className="text-primary text-glow">D'Block</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Let's build something great together</p>
              </div>
              <button onClick={handleClose} className="rounded-full p-2 glass glass-hover text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              {done ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 20px hsl(var(--primary) / 0.5))' }} />
                  <h3 className="font-display text-xl font-bold mb-2">We'll Be In Touch!</h3>
                  <p className="text-muted-foreground text-sm">Thank you, {companyName}. We've received your request and will reach out to {email} shortly.</p>
                  <button onClick={handleClose} className="mt-6 bg-primary text-primary-foreground rounded-xl px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-all glow">
                    Done
                  </button>
                </motion.div>
              ) : (
                <>
                  {stepIndicator}

                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                            <Building2 className="h-3 w-3" /> Company / Your Name
                          </label>
                          <input
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            placeholder="Acme Inc."
                            className="w-full glass rounded-xl px-4 py-3 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                            <Mail className="h-3 w-3" /> Email Address
                          </label>
                          <input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            type="email"
                            placeholder="you@company.com"
                            className="w-full glass rounded-xl px-4 py-3 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                        <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                          <Briefcase className="h-3 w-3" /> Select a Service
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {SERVICES.map(s => (
                            <button
                              key={s}
                              onClick={() => setService(s)}
                              className={`text-left rounded-xl px-4 py-3 text-sm transition-all ${
                                service === s
                                  ? 'bg-primary/15 text-primary neon-border font-medium'
                                  : 'glass glass-hover text-muted-foreground'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                            <DollarSign className="h-3 w-3" /> Budget Range
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {BUDGETS.map(b => (
                              <button
                                key={b}
                                onClick={() => setBudget(b)}
                                className={`rounded-full px-3 py-1.5 text-xs transition-all ${
                                  budget === b
                                    ? 'bg-primary/15 text-primary neon-border font-medium'
                                    : 'glass glass-hover text-muted-foreground'
                                }`}
                              >
                                {b}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                            <FileText className="h-3 w-3" /> Project Details
                          </label>
                          <textarea
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            placeholder="Tell us about your project, goals, timeline..."
                            rows={4}
                            maxLength={2000}
                            className="w-full glass rounded-xl px-4 py-3 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30 resize-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && (
                    <p className="text-xs text-destructive mt-3">{error}</p>
                  )}

                  {/* Navigation buttons */}
                  <div className="flex items-center justify-between mt-6">
                    {step > 1 ? (
                      <button onClick={() => { setStep(s => s - 1); setError(''); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" /> Back
                      </button>
                    ) : (
                      <div />
                    )}

                    {step < 3 ? (
                      <button onClick={nextStep} className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all glow flex items-center gap-2">
                        Continue <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={submit}
                        disabled={submitting}
                        className="bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-all glow flex items-center gap-2 disabled:opacity-40"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Submit Request
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PartnerModal;
