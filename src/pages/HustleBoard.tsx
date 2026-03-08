import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Send, CheckCircle, Loader2, Sparkles, Users, Handshake, Code } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import ParticleBackground from '@/components/ParticleBackground';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { z } from 'zod';

interface Gig {
  id: string;
  title: string;
  description: string;
  contact_info: string;
  category: string;
  created_at: string;
}

const GIG_CATEGORIES = ['Hiring', 'Looking for Work', 'Collab'] as const;

const categoryIcon: Record<string, React.ReactNode> = {
  Hiring: <Users className="h-4 w-4" />,
  'Looking for Work': <Briefcase className="h-4 w-4" />,
  Collab: <Handshake className="h-4 w-4" />,
};

const categoryColor: Record<string, string> = {
  Hiring: 'bg-green-500/10 text-green-400 border-green-500/20',
  'Looking for Work': 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  Collab: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
};

const gigSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Title too long'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  contact_info: z.string().trim().min(3, 'Contact info required').max(200, 'Contact info too long'),
  category: z.enum(GIG_CATEGORIES),
});

const HustleBoard = () => {
  const { user, isAuthenticated } = useAuth();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('All');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [category, setCategory] = useState<string>('Collab');

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    const { data } = await supabase
      .from('community_gigs')
      .select('id, title, description, contact_info, category, created_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    if (data) setGigs(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth', { detail: 'login' }));
      return;
    }

    let validated;
    try {
      validated = gigSchema.parse({ title, description, contact_info: contactInfo, category });
    } catch (e) {
      if (e instanceof z.ZodError) toast.error(e.errors[0].message);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('community_gigs').insert({
      ...validated,
      user_id: user.id,
    });

    if (error) {
      toast.error('Submission failed. Please try again.');
      console.error('[HustleBoard] Insert error:', error);
    } else {
      toast.success('Submitted for Admin Approval!', {
        description: 'Your opportunity will appear once reviewed.',
        duration: 4000,
      });
      setTitle('');
      setDescription('');
      setContactInfo('');
      setCategory('Collab');
      setShowForm(false);
    }
    setSubmitting(false);
  };

  const filteredGigs = filterCat === 'All' ? gigs : gigs.filter(g => g.category === filterCat);

  return (
    <div className="min-h-screen gradient-bg relative">
      <ParticleBackground />
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16 relative z-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Community Board
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Hustle & <span className="text-primary text-glow">Collab</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Post opportunities, find collaborators, and connect with the D'Block community.
          </p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-primary-foreground rounded-xl px-6 py-3 text-sm font-medium hover:opacity-90 transition-all glow inline-flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {showForm ? 'Close Form' : 'Submit Opportunity'}
          </button>
        </motion.div>

        {/* Submit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="overflow-hidden mb-10"
            >
              <div className="glass glow rounded-2xl p-6 max-w-xl mx-auto">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" /> New Opportunity
                </h2>
                <div className="space-y-4">
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Opportunity title..."
                    maxLength={120}
                    className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
                  />
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the opportunity, requirements, what you're looking for..."
                    rows={4}
                    maxLength={2000}
                    className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground resize-none"
                  />
                  <input
                    value={contactInfo}
                    onChange={e => setContactInfo(e.target.value)}
                    placeholder="Contact (email, Twitter, WhatsApp, etc.)"
                    maxLength={200}
                    className="w-full bg-secondary/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
                  />
                  <div>
                    <label className="text-xs text-muted-foreground block mb-2">Category</label>
                    <div className="flex gap-2">
                      {GIG_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
                            category === cat
                              ? 'bg-primary text-primary-foreground glow'
                              : 'glass glass-hover'
                          }`}
                        >
                          {categoryIcon[cat]} {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-primary text-primary-foreground rounded-xl px-6 py-3 text-sm font-medium hover:opacity-90 transition-all glow flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {submitting ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
          {['All', ...GIG_CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                filterCat === cat ? 'bg-primary text-primary-foreground glow' : 'glass glass-hover'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gigs grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredGigs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No opportunities yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
            {filteredGigs.map((gig, i) => (
              <motion.div
                key={gig.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass glass-hover rounded-2xl p-5 break-inside-avoid"
              >
                <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border mb-3 ${categoryColor[gig.category] || 'glass'}`}>
                  {categoryIcon[gig.category]} {gig.category}
                </div>
                <h3 className="font-display font-semibold text-base mb-2">{gig.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3 whitespace-pre-wrap">{gig.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/20">
                  <span>{gig.contact_info}</span>
                  <span>{new Date(gig.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default HustleBoard;
