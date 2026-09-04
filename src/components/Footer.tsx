import { Link } from 'react-router-dom';
import DigestSignup from './DigestSignup';

const Footer = () => {
  return (
    <footer className="relative z-10 glass border-t border-border/10 mt-16">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <DigestSignup />
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <Link
              to="/legal"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Service &amp; Privacy Policy
            </Link>
            <a
              href="https://cctxifxnvqbwjnhurbaf.supabase.co/functions/v1/rss"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              RSS Feed
            </a>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Designed and built by <span className="text-primary font-medium">Suraj</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
