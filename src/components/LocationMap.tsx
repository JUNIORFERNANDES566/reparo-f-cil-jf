import { useEffect, useRef } from "react";
import { MapPin, Navigation } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface LocationMapProps {
  latitude: number | null;
  longitude: number | null;
  city?: string;
  className?: string;
}

export function LocationMap({ latitude, longitude, city, className = "" }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create new map
    const map = L.map(mapRef.current).setView([latitude, longitude], 12);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add marker with custom popup
    const marker = L.marker([latitude, longitude]).addTo(map);
    markerRef.current = marker;
    
    if (city) {
      marker.bindPopup(`<div class="text-center"><strong>${city}</strong><br/>Sua localização</div>`).openPopup();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, city]);

  // Update marker when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && latitude && longitude) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.setView([latitude, longitude], 12);
      
      if (city) {
        markerRef.current.setPopupContent(`<div class="text-center"><strong>${city}</strong><br/>Localização atual</div>`);
      }
    }
  }, [latitude, longitude, city]);

  if (!latitude || !longitude) {
    return (
      <div
        className={`bg-secondary/50 rounded-xl flex flex-col items-center justify-center gap-3 ${className}`}
        style={{ height: "300px" }}
      >
        <div className="animate-pulse">
          <MapPin className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Carregando localização...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className={`rounded-xl overflow-hidden shadow-card ${className}`}
        style={{ height: "300px" }}
      />
      <div className="absolute top-3 left-3 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
        <Navigation className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{city || "Localização atual"}</span>
      </div>
    </div>
  );
}
