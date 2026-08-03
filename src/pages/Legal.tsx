import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';

const paragraphs = [
  `Welcome to D'block. By accessing or using my website, services, and mobile applications, you agree to be bound by these Terms of Service and my Privacy Policy. If you do not agree, please do not use my platform. D'block is a digital platform I created to offer aggregated global and local Ghanaian news, football live-scores, and e-commerce or freelance hustle listings, all built around the motto: Ask. Discover. Elevate. To access certain features, such as subscribing to my weekly email digest or saving articles, you may need to register an account. You agree to provide accurate information, and you are solely responsible for safeguarding your account details.`,
  `Protecting your privacy is fundamental to how I operate D'block. I collect your email address exclusively to send my weekly news digest and updates, and I do not collect sensitive personal data. By providing your email, you explicitly consent to its processing for this purpose, though you may withdraw your consent at any time by utilizing the unsubscribe link in my emails. In strict compliance with Ghana's Data Protection Act, 2012 (Act 843), I employ robust technical measures—including secure backend databases—to protect your data from unauthorized access. I retain your data only for as long as you are actively subscribed, and once you delete your account or unsubscribe, your data is securely erased. Furthermore, under the law, you possess the right to request access to, correction of, or deletion of your personal data by contacting me directly.`,
  `I also ensure my platform complies with the Electronic Transactions Act, 2008 (Act 772) and the Cybersecurity Act, 2020 (Act 1038). Any e-commerce transactions or hustle interactions conducted via D'block are designed with full disclosure and transparency in mind, and I recognize the legal validity of electronic communications facilitated through this platform. I am deeply committed to maintaining the security of the site. In the unlikely event of a data breach, I will promptly notify the Data Protection Commission and affected users as mandated by Ghanaian law. Please note that I provide D'block on an "as is" and "as available" basis. While I strive to provide accurate news and updates using trusted API sources, I do not guarantee the completeness or accuracy of third-party content. Finally, I reserve the right to modify these terms at any time; your continued use of the platform following any changes constitutes your acceptance of the updated terms.`,
];

const Legal = () => {
  return (
    <div className="min-h-screen gradient-bg relative overflow-x-hidden">
      <ParticleBackground />
      <main className="relative z-10 container mx-auto px-4 py-12 max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to D'Block
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass glow rounded-3xl p-6 sm:p-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">
                D'block <span className="text-primary text-glow">Terms of Service</span> &amp; Privacy Policy
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Ask. Discover. Elevate.</p>
            </div>
          </div>

          <div className="space-y-7">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[15px] sm:text-base leading-8 tracking-[0.01em] text-muted-foreground first-letter:text-foreground"
              >
                {p}
              </p>
            ))}
          </div>
        </motion.article>
      </main>
    </div>
  );
};

export default Legal;
