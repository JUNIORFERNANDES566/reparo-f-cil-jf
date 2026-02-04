import { WeatherData, WeatherForecast } from "@/types";

const WEATHER_CACHE_KEY = "weather_cache";
const FORECAST_CACHE_KEY = "forecast_cache";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
  city: string;
}

function getCache<T>(key: string, city: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const item: CacheItem<T> = JSON.parse(cached);
    const isExpired = Date.now() - item.timestamp > CACHE_DURATION;
    const isSameCity = item.city.toLowerCase() === city.toLowerCase();
    
    if (isExpired || !isSameCity) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.data;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T, city: string): void {
  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      city,
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch {
    // Ignore cache errors
  }
}

export async function getCurrentWeather(
  city: string,
  apiKey: string
): Promise<WeatherData | null> {
  if (!apiKey || !city) return null;

  // Check cache first
  const cached = getCache<WeatherData>(WEATHER_CACHE_KEY, city);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},BR&appid=${apiKey}&units=metric&lang=pt_br`
    );

    if (!response.ok) {
      console.error("Weather API error:", response.status);
      return null;
    }

    const data = await response.json();
    
    const weather: WeatherData = {
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      city: data.name,
    };

    setCache(WEATHER_CACHE_KEY, weather, city);
    return weather;
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    return null;
  }
}

export async function getWeatherForecast(
  city: string,
  apiKey: string
): Promise<WeatherForecast[]> {
  if (!apiKey || !city) return [];

  // Check cache first
  const cached = getCache<WeatherForecast[]>(FORECAST_CACHE_KEY, city);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)},BR&appid=${apiKey}&units=metric&lang=pt_br`
    );

    if (!response.ok) {
      console.error("Forecast API error:", response.status);
      return [];
    }

    const data = await response.json();
    
    // Group by day and get one forecast per day
    const dailyForecasts = new Map<string, WeatherForecast>();
    
    for (const item of data.list) {
      const date = item.dt_txt.split(" ")[0];
      
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, {
          date,
          temp: Math.round(item.main.temp),
          tempMin: Math.round(item.main.temp_min),
          tempMax: Math.round(item.main.temp_max),
          description: item.weather[0].description,
          icon: item.weather[0].icon,
        });
      } else {
        const existing = dailyForecasts.get(date)!;
        existing.tempMin = Math.min(existing.tempMin, Math.round(item.main.temp_min));
        existing.tempMax = Math.max(existing.tempMax, Math.round(item.main.temp_max));
      }
    }

    const forecasts = Array.from(dailyForecasts.values()).slice(0, 5);
    setCache(FORECAST_CACHE_KEY, forecasts, city);
    return forecasts;
  } catch (error) {
    console.error("Failed to fetch forecast:", error);
    return [];
  }
}

export function getWeatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}
