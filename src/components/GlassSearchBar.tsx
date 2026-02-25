import { Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const GlassSearchBar = () => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      className={`glass rounded-2xl p-1 max-w-2xl mx-auto transition-all duration-300 ${focused ? 'glow-strong' : 'glow'}`}
      animate={{ scale: focused ? 1.02 : 1 }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <Sparkles className="h-5 w-5 text-primary animate-glow-pulse flex-shrink-0" />
        <input
          type="text"
          placeholder="AI-Powered: Ask anything..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none font-body"
        />
        <button className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 transition-all flex-shrink-0">
          <Search className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default GlassSearchBar;