import { Cloud, Sun } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AppConfig } from "@/types";

interface WeatherForecastWidgetProps {
  city: string;
}

const defaultConfig: AppConfig = {
  openWeatherApiKey: "",
  empresaNome: "",
  empresaCnpj: "",
  empresaEndereco: "",
  empresaTelefone: "",
  empresaEmail: "",
};

export function WeatherForecastWidget({ city }: WeatherForecastWidgetProps) {
  const [config] = useLocalStorage<AppConfig>("appConfig", defaultConfig);

  if (!config.openWeatherApiKey) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Configure sua chave de API do OpenWeatherMap em Configurações para ver a previsão do tempo.
      </div>
    );
  }

  // Placeholder for forecast data
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];

  return (
    <div className="grid grid-cols-5 gap-2">
      {days.map((day) => (
        <div key={day} className="text-center p-2 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground mb-1">{day}</p>
          <Sun className="h-5 w-5 mx-auto text-primary" />
          <p className="text-sm font-medium text-foreground mt-1">--°</p>
        </div>
      ))}
    </div>
  );
}
