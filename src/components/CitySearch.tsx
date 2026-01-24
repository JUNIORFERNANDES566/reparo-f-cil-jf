import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CitySearchProps {
  onCitySelect: (city: string, lat: number, lon: number) => void;
  currentCity: string;
}

export function CitySearch({ onCitySelect, currentCity }: CitySearchProps) {
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const cityName = display_name.split(",")[0];
        onCitySelect(cityName, parseFloat(lat), parseFloat(lon));
        setSearch("");
      }
    } catch (error) {
      console.error("Erro ao buscar cidade:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-10"
        />
      </div>
      <Button onClick={handleSearch} disabled={isSearching} size="sm">
        {isSearching ? "..." : "Buscar"}
      </Button>
      {currentCity && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">{currentCity}</span>
        </div>
      )}
    </div>
  );
}
