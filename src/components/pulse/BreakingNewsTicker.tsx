import { useEffect, useState } from 'react';

const headlines = [
  '🔴 LIVE: Apple Event just announced — New M5 MacBook Pro revealed',
  '🔴 LIVE: Ghana vs Nigeria match update — 2-1 at half-time',
  '🔴 LIVE: Bitcoin surges past $69K as institutional buying accelerates',
  '🔴 LIVE: SpaceX Starship completes historic orbital test flight',
  '🔴 LIVE: EU passes landmark AI regulation framework effective 2027',
];

const BreakingNewsTicker = () => {
  const [tick, setTick] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => !t), 800);
    return () => clearInterval(iv);
  }, []);

  const doubled = [...headlines, ...headlines];

  return (
    <div className="w-full overflow-hidden bg-destructive/10 border-b border-destructive/20 backdrop-blur-md">
      <div className="flex items-center">
        {/* Static BREAKING label */}
        <div className="shrink-0 bg-destructive px-4 py-2 flex items-center gap-2 z-10">
          <span
            className={`h-2.5 w-2.5 rounded-full transition-opacity duration-300 ${
              tick ? 'bg-white opacity-100' : 'bg-white/40 opacity-50'
            }`}
          />
          <span className="text-destructive-foreground font-bold text-xs tracking-widest uppercase font-display">
            Breaking
          </span>
        </div>

        {/* Scrolling headlines */}
        <div className="overflow-hidden flex-1">
          <div className="breaking-ticker-track flex items-center gap-16 py-2 whitespace-nowrap">
            {doubled.map((h, i) => (
              <span
                key={i}
                className="text-sm font-medium text-foreground shrink-0 flex items-center gap-2"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakingNewsTicker;
