import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, CloudRain, CloudSnow, Cloud } from 'lucide-react';

interface CityHub {
  name: string;
  country: string;
  timezone: string;
  lat: number;
  lon: number;
  image: string;
}

const cities: CityHub[] = [
  {
    name: 'Accra',
    country: 'Ghana',
    timezone: 'Africa/Accra',
    lat: 5.6037,
    lon: -0.187,
    image: 'https://images.unsplash.com/photo-1642427749670-f20e2e76ed8c?w=800&q=80',
  },
  {
    name: 'San Francisco',
    country: 'Silicon Valley',
    timezone: 'America/Los_Angeles',
    lat: 37.7749,
    lon: -122.4194,
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
  },
  {
    name: 'London',
    country: 'United Kingdom',
    timezone: 'Europe/London',
    lat: 51.5074,
    lon: -0.1278,
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    timezone: 'Asia/Tokyo',
    lat: 35.6762,
    lon: 139.6503,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  },
];

interface WeatherInfo {
  code: number;
  temp: number;
}

const getWeatherIcon = (code: number, isDay: boolean) => {
  if (code <= 1) return isDay ? Sun : Moon;
  if (code <= 3) return Cloud;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  return Cloud;
};

const isNightInTimezone = (tz: string): boolean => {
  const hour = new Date().toLocaleString('en-US', {
    timeZone: tz,
    hour: 'numeric',
    hour12: false,
  });
  const h = parseInt(hour, 10);
  return h < 6 || h >= 20;
};

const getLocalTime = (tz: string): string =>
  new Date().toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const GlobalHubs = () => {
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherInfo>>({});
  const [now, setNow] = useState(Date.now());

  // Tick every 30s for time updates
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

  // Fetch weather for all cities
  useEffect(() => {
    const fetchAll = async () => {
      const results: Record<string, WeatherInfo> = {};
      await Promise.all(
        cities.map(async (city) => {
          try {
            const res = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code`
            );
            const data = await res.json();
            results[city.name] = {
              code: data.current.weather_code,
              temp: Math.round(data.current.temperature_2m),
            };
          } catch {
            // skip
          }
        })
      );
      setWeatherMap(results);
    };
    fetchAll();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          🌍 Global Hubs
        </h2>
        <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
          Live weather & time
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cities.map((city, i) => {
          const night = isNightInTimezone(city.timezone);
          const weather = weatherMap[city.name];
          const WIcon = weather
            ? getWeatherIcon(weather.code, !night)
            : night
            ? Moon
            : Sun;

          return (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl overflow-hidden h-56 group cursor-default glass glow"
            >
              {/* Background image */}
              <img
                src={city.image}
                alt={`${city.name} skyline`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />

              {/* Glass overlay */}
              <div className="absolute inset-0 glass-strong" />

              {/* Ambient tint — darker at night */}
              <div
                className={`absolute inset-0 transition-colors duration-500 ${
                  night
                    ? 'bg-gradient-to-t from-black/70 via-black/40 to-black/30'
                    : 'bg-gradient-to-t from-black/60 via-black/25 to-transparent'
                }`}
              />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-between p-5">
                {/* Top: weather icon + temp */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-foreground/90 text-sm font-medium glass rounded-full px-2.5 py-1">
                    <WIcon className="h-4 w-4 text-primary" />
                    {weather ? `${weather.temp}°C` : '—'}
                  </span>
                  {night && (
                    <span className="text-[10px] glass rounded-full px-2 py-0.5 text-foreground/70">
                      Night
                    </span>
                  )}
                </div>

                {/* Bottom: city info + time */}
                <div>
                  <p className="font-display text-3xl font-bold text-foreground tracking-tight leading-tight text-glow">
                    {getLocalTime(city.timezone)}
                  </p>
                  <p className="font-display text-lg font-semibold text-foreground mt-1">
                    {city.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{city.country}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GlobalHubs;
