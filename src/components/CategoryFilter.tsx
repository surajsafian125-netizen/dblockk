import { motion } from 'framer-motion';

interface Props {
  categories: string[];
  active: string;
  onChange: (c: string) => void;
  className?: string;
}

const CategoryFilter = ({ categories, active, onChange, className = '' }: Props) => {
  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 ${className}`}
    >
      {categories.map(cat => {
        const isActive = active.toLowerCase() === cat.toLowerCase();
        return (
          <motion.button
            key={cat}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(cat)}
            className={`shrink-0 snap-start rounded-full px-4 py-1.5 text-xs font-medium border transition-all ${
              isActive
                ? 'bg-primary/20 text-primary border-primary/40 glow'
                : 'glass glass-hover border-border/30 text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </motion.button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
