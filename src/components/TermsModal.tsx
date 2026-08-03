import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
  onClose: () => void;
}

const paragraphs = [
  `Welcome to D'block. By accessing or using my website, services, and mobile applications, you agree to be bound by these Terms of Service and my Privacy Policy. If you do not agree, please do not use my platform. D'block is a digital platform I created to offer aggregated global and local Ghanaian news, football live-scores, and e-commerce or freelance hustle listings, all built around the motto: Ask. Discover. Elevate. To access certain features, such as subscribing to my weekly email digest or saving articles, you may need to register an account. You agree to provide accurate information, and you are solely responsible for safeguarding your account details.`,
  `Protecting your privacy is fundamental to how I operate D'block. I collect your email address exclusively to send my weekly news digest and updates, and I do not collect sensitive personal data. By providing your email, you explicitly consent to its processing for this purpose, though you may withdraw your consent at any time by utilizing the unsubscribe link in my emails. In strict compliance with Ghana's Data Protection Act, 2012 (Act 843), I employ robust technical measures—including secure backend databases—to protect your data from unauthorized access. I retain your data only for as long as you are actively subscribed, and once you delete your account or unsubscribe, your data is securely erased. Furthermore, under the law, you possess the right to request access to, correction of, or deletion of your personal data by contacting me directly.`,
  `I also ensure my platform complies with the Electronic Transactions Act, 2008 (Act 772) and the Cybersecurity Act, 2020 (Act 1038). Any e-commerce transactions or hustle interactions conducted via D'block are designed with full disclosure and transparency in mind, and I recognize the legal validity of electronic communications facilitated through this platform. I am deeply committed to maintaining the security of the site. In the unlikely event of a data breach, I will promptly notify the Data Protection Commission and affected users as mandated by Ghanaian law. Please note that I provide D'block on an "as is" and "as available" basis. While I strive to provide accurate news and updates using trusted API sources, I do not guarantee the completeness or accuracy of third-party content. Finally, I reserve the right to modify these terms at any time; your continued use of the platform following any changes constitutes your acceptance of the updated terms.`,
];

const TermsModal = ({ open, onAccept, onClose }: TermsModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-hidden"
          onClick={onClose}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'hsl(var(--background) / 0.75)', backdropFilter: 'blur(8px)' }}
          />
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong glow rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[88vh] flex flex-col"
          >
            <div className="flex items-center gap-3 p-6 border-b border-border/20 shrink-0">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl sm:text-2xl font-bold leading-tight">
                  D'block <span className="text-primary text-glow">Terms & Privacy Policy</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Ask. Discover. Elevate.</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="glass rounded-full p-2 text-muted-foreground hover:text-foreground glass-hover transition-all shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-5">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="text-[14px] sm:text-[15px] leading-7 tracking-[0.01em] text-muted-foreground first-letter:text-foreground"
                >
                  {p}
                </p>
              ))}
              <Link
                to="/legal"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                Read full policy <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-6 border-t border-border/20 shrink-0">
              <p className="text-[11px] text-center text-muted-foreground/70 mb-3 leading-relaxed">
                By continuing you agree to D'Block's Terms & Privacy Policy.
              </p>
              <button
                onClick={onAccept}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium hover:opacity-90 transition-all glow inline-flex items-center justify-center gap-2"
              >
                I Agree — Continue to Login
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TermsModal;
