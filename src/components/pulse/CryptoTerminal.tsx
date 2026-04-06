import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  usd: number;
  change24h: number;
}

const COIN_META: { id: string; name: string; symbol: string; logo: string }[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    logo: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    logo: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  },
];

const CryptoTerminal = () => {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = async () => {
    try {
      const ids = COIN_META.map((c) => c.id).join(',');
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );
      const json = await res.json();
      const mapped: CoinData[] = COIN_META.map((meta) => ({
        ...meta,
        usd: json[meta.id]?.usd ?? 0,
        change24h: json[meta.id]?.usd_24h_change ?? 0,
      }));
      setCoins(mapped);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch crypto prices:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrices();
    const iv = setInterval(fetchPrices, 60000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          💰 Crypto Terminal
        </h2>
        {lastUpdated && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {loading
          ? COIN_META.map((c) => (
              <div
                key={c.id}
                className="glass rounded-2xl p-6 h-48 skeleton-shimmer"
              />
            ))
          : coins.map((coin, i) => {
              const up = coin.change24h >= 0;
              return (
                <motion.div
                  key={coin.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative glass rounded-2xl p-6 overflow-hidden group"
                  style={{
                    boxShadow: up
                      ? '0 0 30px rgba(34,197,94,0.2), 0 0 60px rgba(34,197,94,0.05)'
                      : '0 0 30px rgba(239,68,68,0.2), 0 0 60px rgba(239,68,68,0.05)',
                    borderColor: up
                      ? 'rgba(34,197,94,0.25)'
                      : 'rgba(239,68,68,0.25)',
                    borderWidth: '1px',
                  }}
                >
                  {/* Glow orb */}
                  <div
                    className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40"
                    style={{
                      background: up
                        ? 'radial-gradient(circle, rgba(34,197,94,0.6), transparent)'
                        : 'radial-gradient(circle, rgba(239,68,68,0.6), transparent)',
                    }}
                  />

                  <div className="relative z-10 flex flex-col items-center text-center gap-3">
                    <img
                      src={coin.logo}
                      alt={coin.name}
                      className="w-14 h-14 rounded-full ring-2 ring-border/20"
                      loading="lazy"
                    />
                    <div>
                      <p className="font-display font-bold text-lg">{coin.name}</p>
                      <p className="text-xs text-muted-foreground">{coin.symbol}</p>
                    </div>
                    <p className="font-display text-3xl font-bold tracking-tight">
                      ${coin.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <span
                      className={`flex items-center gap-1 text-sm font-semibold ${
                        up ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {up ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {up ? '+' : ''}
                      {coin.change24h.toFixed(2)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
      </div>
    </div>
  );
};

export default CryptoTerminal;
