import { useEffect, useState } from "react";
import { Cloud, Droplets, Wind, AlertCircle } from "lucide-react";
import { WeatherData } from "@/types";
import { getCurrentWeather, getWeatherIconUrl } from "@/lib/weather";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AppConfig } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherWidgetProps {
  city?: string;
  compact?: boolean;
}

const defaultConfig: AppConfig = {
  openWeatherApiKey: "",
  empresaNome: "",
  empresaCnpj: "",
  empresaEndereco: "",
  empresaTelefone: "",
  empresaEmail: "",
};

export function WeatherWidget({ city = "São Paulo", compact = false }: WeatherWidgetProps) {
  const [config] = useLocalStorage<AppConfig>("appConfig", defaultConfig);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      if (!config.openWeatherApiKey) {
        setLoading(false);
        setError(true);
        return;
      }

      setLoading(true);
      setError(false);
      
      const data = await getCurrentWeather(city, config.openWeatherApiKey);
      
      if (data) {
        setWeather(data);
      } else {
        setError(true);
      }
      setLoading(false);
    }

    fetchWeather();
  }, [city, config.openWeatherApiKey]);

  if (!config.openWeatherApiKey) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>Configure a API de clima nas configurações</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Cloud className="h-4 w-4" />
        <span>Clima indisponível</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <img
          src={getWeatherIconUrl(weather.icon)}
          alt={weather.description}
          className="w-10 h-10"
        />
        <div>
          <p className="font-semibold text-foreground">{weather.temp}°C</p>
          <p className="text-xs text-muted-foreground capitalize">{weather.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={getWeatherIconUrl(weather.icon)}
            alt={weather.description}
            className="w-16 h-16"
          />
          <div>
            <p className="text-3xl font-bold text-foreground">{weather.temp}°C</p>
            <p className="text-sm text-muted-foreground capitalize">{weather.description}</p>
            <p className="text-xs text-muted-foreground">{weather.city}</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Droplets className="h-4 w-4" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wind className="h-4 w-4" />
            <span>{weather.windSpeed} m/s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
