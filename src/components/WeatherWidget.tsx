import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AppConfig } from "@/types";

interface WeatherWidgetProps {
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

export function WeatherWidget({ city }: WeatherWidgetProps) {
  const [config] = useLocalStorage<AppConfig>("appConfig", defaultConfig);

  // If no API key, show placeholder
  if (!config.openWeatherApiKey) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Sun className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{city}</p>
            <p className="text-lg font-semibold text-foreground">Configure a API</p>
            <p className="text-xs text-muted-foreground">Vá em Configurações</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-border/50">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Sun className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{city}</p>
          <p className="text-lg font-semibold text-foreground">--°C</p>
          <p className="text-xs text-muted-foreground">Carregando...</p>
        </div>
      </div>
    </div>
  );
}
