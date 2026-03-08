import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Cloud, Droplets, Wind, Thermometer, Eye, Sun, CloudRain, CloudSnow, CloudLightning, CloudFog, Loader2 } from 'lucide-react';
import LocalPulse from './LocalPulse';

interface GeoData {
  city: string;
  country: string;
  lat: number;
  lon: number;
}

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
}

const weatherDescriptions: Record<number, { label: string; icon: typeof Sun }> = {
  0: { label: 'Clear Sky', icon: Sun },
  1: { label: 'Mostly Clear', icon: Sun },
  2: { label: 'Partly Cloudy', icon: Cloud },
  3: { label: 'Overcast', icon: Cloud },
  45: { label: 'Foggy', icon: CloudFog },
  48: { label: 'Rime Fog', icon: CloudFog },
  51: { label: 'Light Drizzle', icon: CloudRain },
  53: { label: 'Drizzle', icon: CloudRain },
  55: { label: 'Heavy Drizzle', icon: CloudRain },
  61: { label: 'Light Rain', icon: CloudRain },
  63: { label: 'Rain', icon: CloudRain },
  65: { label: 'Heavy Rain', icon: CloudRain },
  71: { label: 'Light Snow', icon: CloudSnow },
  73: { label: 'Snow', icon: CloudSnow },
  75: { label: 'Heavy Snow', icon: CloudSnow },
  80: { label: 'Rain Showers', icon: CloudRain },
  81: { label: 'Moderate Showers', icon: CloudRain },
  82: { label: 'Heavy Showers', icon: CloudRain },
  95: { label: 'Thunderstorm', icon: CloudLightning },
  96: { label: 'Thunderstorm + Hail', icon: CloudLightning },
  99: { label: 'Severe Thunderstorm', icon: CloudLightning },
};

const getWeatherInfo = (code: number) =>
  weatherDescriptions[code] ?? { label: 'Unknown', icon: Cloud };

const GeoIntelligenceHub = () => {
  const [geo, setGeo] = useState<GeoData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Step 1: Get browser geolocation + reverse geocode
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by your browser');
      setGeoLoading(false);
      setWeatherLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          setGeo({
            city: data.city || data.locality || data.principalSubdivision || 'Unknown City',
            country: data.countryName || 'Unknown Country',
            lat: latitude,
            lon: longitude,
          });
        } catch {
          setGeo({ city: 'Unknown', country: 'Unknown', lat: latitude, lon: longitude });
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(
          err.code === 1
            ? 'Location access denied. Enable it in your browser settings.'
            : 'Could not determine your location.'
        );
        setGeoLoading(false);
        setWeatherLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Step 2: Fetch weather once geo is available
  useEffect(() => {
    if (!geo) return;

    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day`
        );
        const data = await res.json();
        const c = data.current;
        setWeather({
          temperature: Math.round(c.temperature_2m),
          feelsLike: Math.round(c.apparent_temperature),
          humidity: c.relative_humidity_2m,
          windSpeed: Math.round(c.wind_speed_10m),
          weatherCode: c.weather_code,
          isDay: c.is_day === 1,
        });
      } catch {
        setWeather(null);
      }
      setWeatherLoading(false);
    };

    fetchWeather();
  }, [geo]);

  const weatherInfo = weather ? getWeatherInfo(weather.weatherCode) : null;
  const WeatherIcon = weatherInfo?.icon ?? Cloud;

  return (
    <section className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <MapPin className="h-6 w-6 text-primary" />
          <h2 className="font-display text-3xl font-bold text-center">
            Geo-Intelligence <span className="text-primary text-glow">Hub</span>
          </h2>
        </div>

        {/* Geo error state */}
        {geoError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass glow rounded-2xl p-8 text-center mb-6"
          >
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{geoError}</p>
            <p className="text-muted-foreground/60 text-xs mt-2">
              Showing default Ghana news instead.
            </p>
          </motion.div>
        )}

        {/* Loading state */}
        {geoLoading && (
          <div className="glass glow rounded-2xl p-8 flex items-center justify-center gap-3 mb-6">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span className="text-muted-foreground text-sm">Detecting your location…</span>
          </div>
        )}

        {/* Weather Card */}
        {geo && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass glow rounded-2xl p-6 mb-6"
          >
            {/* Location badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-display font-semibold text-base">
                  {geo.city}, {geo.country}
                </span>
                <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {geo.lat.toFixed(2)}°, {geo.lon.toFixed(2)}°
              </span>
            </div>

            {weatherLoading ? (
              <div className="flex items-center justify-center py-8 gap-3">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-muted-foreground text-sm">Fetching weather…</span>
              </div>
            ) : weather ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Main temp */}
                <div className="glass rounded-xl p-4 flex flex-col items-center justify-center col-span-2 md:col-span-1">
                  <WeatherIcon className="h-10 w-10 text-primary mb-2" />
                  <span className="font-display text-4xl font-bold">{weather.temperature}°C</span>
                  <span className="text-xs text-muted-foreground mt-1">{weatherInfo?.label}</span>
                </div>

                {/* Feels like */}
                <div className="glass rounded-xl p-4 flex flex-col items-center justify-center">
                  <Thermometer className="h-5 w-5 text-primary/70 mb-2" />
                  <span className="font-display text-xl font-semibold">{weather.feelsLike}°C</span>
                  <span className="text-[11px] text-muted-foreground mt-1">Feels Like</span>
                </div>

                {/* Humidity */}
                <div className="glass rounded-xl p-4 flex flex-col items-center justify-center">
                  <Droplets className="h-5 w-5 text-primary/70 mb-2" />
                  <span className="font-display text-xl font-semibold">{weather.humidity}%</span>
                  <span className="text-[11px] text-muted-foreground mt-1">Humidity</span>
                </div>

                {/* Wind */}
                <div className="glass rounded-xl p-4 flex flex-col items-center justify-center">
                  <Wind className="h-5 w-5 text-primary/70 mb-2" />
                  <span className="font-display text-xl font-semibold">{weather.windSpeed} km/h</span>
                  <span className="text-[11px] text-muted-foreground mt-1">Wind</span>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-6">
                Could not load weather data.
              </p>
            )}
          </motion.div>
        )}

        {/* Local News — dynamically uses detected city or falls back to Ghana */}
        <LocalPulse cityQuery={geo?.city} countryQuery={geo?.country} />
      </motion.div>
    </section>
  );
};

export default GeoIntelligenceHub;
