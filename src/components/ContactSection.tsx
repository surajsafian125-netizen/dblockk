import { motion } from 'framer-motion';
import { Mail, Linkedin } from 'lucide-react';

const socials = [
  {
    icon: Mail,
    label: 'Email',
    value: 'surajmohammed129@gmail.com',
    href: 'mailto:surajmohammed129@gmail.com',
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z" />
      </svg>
    ),
    label: 'TikTok',
    value: '@biggsuraj',
    href: 'https://www.tiktok.com/@biggsuraj',
  },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    value: 'SURAJ SAFIAN',
    href: 'https://www.linkedin.com/in/suraj-safian',
  },
];

const ContactSection = () => {
  return (
    <section id="contact" className="container mx-auto px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
          Let's <span className="text-primary text-glow">Work.</span>
        </h2>

        <p className="text-muted-foreground leading-relaxed mb-12 text-base md:text-lg">
          I'm a student who builds sleek, high-performing websites for businesses
          and creators. Operating 100% in the digital space, I skip the corporate
          fluff—just good energy and solid results. Whether you need a digital
          upgrade or want to collaborate, hit my line.
        </p>

        <div className="flex flex-col gap-4 max-w-md mx-auto">
          {socials.map((s, i) => (
            <motion.a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.03 }}
              className="glass glow rounded-xl px-5 py-4 flex items-center gap-4 text-left group hover:border-primary/30 transition-colors"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {s.label}
                </p>
                <p className="text-foreground font-medium truncate">{s.value}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default ContactSection;
