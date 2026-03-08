import { motion } from 'framer-motion';

const SkeletonCard = ({ index = 0 }: { index?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.4 }}
    className="glass rounded-2xl overflow-hidden"
  >
    {/* Image placeholder */}
    <div className="h-48 skeleton-shimmer" />

    {/* Body */}
    <div className="p-5 space-y-3">
      {/* Title */}
      <div className="h-5 skeleton-shimmer rounded-lg w-4/5" />
      <div className="h-4 skeleton-shimmer rounded-lg w-3/5" />

      {/* Description lines */}
      <div className="space-y-2 pt-1">
        <div className="h-3 skeleton-shimmer rounded-md w-full" />
        <div className="h-3 skeleton-shimmer rounded-md w-5/6" />
      </div>

      {/* Tags */}
      <div className="flex gap-1.5 pt-1">
        <div className="h-5 skeleton-shimmer rounded-full w-14" />
        <div className="h-5 skeleton-shimmer rounded-full w-16" />
        <div className="h-5 skeleton-shimmer rounded-full w-12" />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <div className="h-3 skeleton-shimmer rounded-md w-12" />
          <div className="h-3 skeleton-shimmer rounded-md w-10" />
        </div>
        <div className="flex gap-3">
          <div className="h-3 skeleton-shimmer rounded-md w-10" />
          <div className="h-3 skeleton-shimmer rounded-md w-8" />
        </div>
      </div>
    </div>
  </motion.div>
);

export const SkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} index={i} />
    ))}
  </div>
);

export default SkeletonCard;
