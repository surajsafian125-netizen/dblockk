import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CoinPrice {
  id: string;
  symbol: string;
  usd: number;
  usd_24h_change: number;
}

const COINS = 'bitcoin,ethereum,solana,dogecoin,cardano,ripple,polkadot,avalanche-2';

const MarqueeTicker = () => {
  const [coins, setCoins] = useState<CoinPrice[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${COINS}&vs_currencies=usd&include_24hr_change=true`
        );
        const json = await res.json();
        const mapped: CoinPrice[] = Object.entries(json).map(([id, data]: [string, any]) => ({
          id,
          symbol: id === 'avalanche-2' ? 'AVAX' : id.slice(0, 4).toUpperCase(),
          usd: data.usd,
          usd_24h_change: data.usd_24h_change ?? 0,
        }));
        setCoins(mapped);
      } catch {
        // Silently fail — ticker just won't show
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (coins.length === 0) return null;

  // Double the items for seamless loop
  const items = [...coins, ...coins];

  return (
    <div className="fixed top-16 left-0 right-0 z-40 overflow-hidden border-b border-border/10 bg-background/60 backdrop-blur-md">
      <div className="marquee-track flex items-center gap-8 py-1.5 whitespace-nowrap">
        {items.map((coin, i) => {
          const isPositive = coin.usd_24h_change >= 0;
          return (
            <span key={`${coin.id}-${i}`} className="flex items-center gap-1.5 text-xs font-mono shrink-0">
              <span className="text-muted-foreground font-medium">{coin.symbol}</span>
              <span className="text-foreground">${coin.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              <span className={`flex items-center gap-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {isPositive ? '+' : ''}{coin.usd_24h_change.toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default MarqueeTicker;
