import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
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

interface ServiceMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  className?: string;
}

export function ServiceMap({ latitude, longitude, address, className = "" }: ServiceMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [noLocation, setNoLocation] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    // If no coordinates, show placeholder
    if (!latitude || !longitude) {
      setNoLocation(true);
      return;
    }

    setNoLocation(false);

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create new map
    const map = L.map(mapRef.current).setView([latitude, longitude], 15);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add marker
    const marker = L.marker([latitude, longitude]).addTo(map);
    if (address) {
      marker.bindPopup(address).openPopup();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, address]);

  if (noLocation) {
    return (
      <div
        className={`bg-secondary/50 rounded-lg flex flex-col items-center justify-center gap-2 ${className}`}
        style={{ minHeight: "200px" }}
      >
        <MapPin className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Localização não disponível
        </p>
        {address && (
          <p className="text-xs text-muted-foreground text-center px-4">{address}</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: "200px" }}
    />
  );
}
