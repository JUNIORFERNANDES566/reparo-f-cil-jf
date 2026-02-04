import { useState } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { geocodeAddress } from "@/lib/geocoding";

interface CitySearchProps {
  onCitySelect: (city: string, lat: number, lon: number) => void;
  currentCity?: string;
}

export function CitySearch({ onCitySelect, currentCity }: CitySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await geocodeAddress(searchQuery);
      
      if (result) {
        // Extract city name from display name
        const parts = result.displayName.split(",");
        const cityName = parts[0]?.trim() || searchQuery;
        
        onCitySelect(cityName, result.lat, result.lon);
        setSearchQuery("");
      } else {
        setError("Cidade não encontrada. Tente novamente.");
      }
    } catch {
      setError("Erro ao buscar cidade. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar cidade (ex: Pelotas, Porto Alegre...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
            disabled={loading}
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={loading || !searchQuery.trim()}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Buscar</span>
        </Button>
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      {currentCity && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Localização atual: {currentCity}
        </p>
      )}
    </div>
  );
}
