import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, Clock, Eye } from 'lucide-react';
import type { PostDisplay } from './ContentGrid';

interface MyStashProps {
  open: boolean;
  onClose: () => void;
  posts: PostDisplay[];
  loading: boolean;
  onRemove: (postId: string) => void;
  onSelect: (post: PostDisplay) => void;
}

const MyStash = ({ open, onClose, posts, loading, onRemove, onSelect }: MyStashProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
          />

          {/* Slide-out panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md border-l border-border/20 bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/20">
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold">My Stash</h2>
                <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
                  {posts.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 glass glass-hover text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                  Loading stash…
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bookmark className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Your stash is empty</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Bookmark articles to read later</p>
                </div>
              ) : (
                posts.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="glass rounded-xl overflow-hidden flex gap-3 p-3 cursor-pointer group hover:border-primary/20 transition-all"
                    onClick={() => { onSelect(post); onClose(); }}
                  >
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-20 h-20 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime}m</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(post.id); }}
                      className="self-start shrink-0 p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      title="Remove from stash"
                    >
                      <Bookmark className="h-4 w-4 fill-current" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MyStash;
