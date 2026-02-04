import { useEffect, useState } from "react";
import { WeatherForecast } from "@/types";
import { getWeatherForecast, getWeatherIconUrl } from "@/lib/weather";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AppConfig } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WeatherForecastWidgetProps {
  city?: string;
}

const defaultConfig: AppConfig = {
  openWeatherApiKey: "",
  empresaNome: "",
  empresaCnpj: "",
  empresaEndereco: "",
  empresaTelefone: "",
  empresaEmail: "",
};

export function WeatherForecastWidget({ city = "São Paulo" }: WeatherForecastWidgetProps) {
  const [config] = useLocalStorage<AppConfig>("appConfig", defaultConfig);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchForecast() {
      if (!config.openWeatherApiKey) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await getWeatherForecast(city, config.openWeatherApiKey);
      setForecast(data);
      setLoading(false);
    }

    fetchForecast();
  }, [city, config.openWeatherApiKey]);

  if (!config.openWeatherApiKey) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (forecast.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {forecast.map((day) => (
        <div
          key={day.date}
          className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg min-w-[70px]"
        >
          <p className="text-xs font-medium text-muted-foreground">
            {format(parseISO(day.date), "EEE", { locale: ptBR })}
          </p>
          <img
            src={getWeatherIconUrl(day.icon)}
            alt={day.description}
            className="w-8 h-8"
          />
          <div className="flex gap-1 text-xs">
            <span className="font-semibold text-foreground">{day.tempMax}°</span>
            <span className="text-muted-foreground">{day.tempMin}°</span>
          </div>
        </div>
      ))}
    </div>
  );
}
