import DigestSignup from './DigestSignup';

const Footer = () => {
  return (
    <footer className="relative z-10 glass border-t border-border/10 mt-16">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <DigestSignup />
        <p className="text-sm text-muted-foreground text-center">
          Designed and built by <span className="text-primary font-medium">Suraj</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
