import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Servico, Cliente } from "@/types";
import { geocodeAddress } from "@/lib/geocoding";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

// Custom icons for different status
const createStatusIcon = (status: string) => {
  const colors: Record<string, string> = {
    agendado: "#3b82f6",
    em_andamento: "#f59e0b",
    concluido: "#22c55e",
    cancelado: "#ef4444",
  };

  const color = colors[status] || "#3b82f6";

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">●</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface ServicesMapViewProps {
  servicos: Servico[];
  clientes: Cliente[];
  onServicoClick?: (servico: Servico) => void;
  className?: string;
  showOnlyActive?: boolean;
}

export function ServicesMapView({
  servicos,
  clientes,
  onServicoClick,
  className = "",
  showOnlyActive = true,
}: ServicesMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          // Default to Pelotas, RS
          setUserLocation({ lat: -31.7654, lon: -52.3376 });
        }
      );
    } else {
      setUserLocation({ lat: -31.7654, lon: -52.3376 });
    }
  }, []);

  // Filter services to show
  const filteredServicos = showOnlyActive
    ? servicos.filter((s) => s.status === "agendado" || s.status === "em_andamento")
    : servicos;

  // Get client address by ID
  const getClienteEndereco = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) return null;
    return `${cliente.endereco}, ${cliente.cidade}`;
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create new map
    const map = L.map(mapRef.current).setView([userLocation.lat, userLocation.lon], 12);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add user location marker
    L.circleMarker([userLocation.lat, userLocation.lon], {
      radius: 8,
      fillColor: "#3b82f6",
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    })
      .addTo(map)
      .bindPopup("Sua localização");

    setLoading(false);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation]);

  // Add service markers
  useEffect(() => {
    if (!mapInstanceRef.current || loading) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const addMarkers = async () => {
      const bounds: L.LatLngBoundsExpression = [];

      for (const servico of filteredServicos) {
        let lat = servico.latitude;
        let lon = servico.longitude;

        // If no coordinates, try to geocode from client address
        if (!lat || !lon) {
          const endereco = getClienteEndereco(servico.clienteId);
          if (endereco) {
            const result = await geocodeAddress(endereco);
            if (result) {
              lat = result.lat;
              lon = result.lon;
            }
          }
        }

        if (lat && lon) {
          const cliente = clientes.find((c) => c.id === servico.clienteId);
          const statusLabels: Record<string, string> = {
            agendado: "Agendado",
            em_andamento: "Em Andamento",
            concluido: "Concluído",
            cancelado: "Cancelado",
          };

          const popupContent = `
            <div style="min-width: 200px;">
              <h4 style="font-weight: 600; margin: 0 0 8px 0;">${servico.titulo}</h4>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Status:</strong> ${statusLabels[servico.status] || servico.status}
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Cliente:</strong> ${cliente?.nome || "N/A"}
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Tipo:</strong> ${servico.tipoServico}
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Data:</strong> ${new Date(servico.data).toLocaleDateString("pt-BR")}
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                <strong>Horário:</strong> ${servico.horario}
              </p>
            </div>
          `;

          const marker = L.marker([lat, lon], {
            icon: createStatusIcon(servico.status),
          })
            .addTo(map)
            .bindPopup(popupContent);

          marker.on("click", () => {
            if (onServicoClick) {
              onServicoClick(servico);
            }
          });

          markersRef.current.push(marker);
          bounds.push([lat, lon]);
        }
      }

      // Fit bounds if there are markers
      if (bounds.length > 0 && userLocation) {
        bounds.push([userLocation.lat, userLocation.lon]);
        map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
      }
    };

    addMarkers();
  }, [filteredServicos, clientes, loading, onServicoClick, userLocation]);

  const centerOnUserLocation = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], 14);
    }
  };

  if (!userLocation) {
    return (
      <div
        className={cn(
          "bg-secondary/50 rounded-lg flex flex-col items-center justify-center gap-2",
          className
        )}
        style={{ height: "300px" }}
      >
        <MapPin className="h-8 w-8 text-muted-foreground animate-pulse" />
        <p className="text-sm text-muted-foreground">Carregando mapa...</p>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden", className)}>
      <div ref={mapRef} className="w-full" style={{ height: "300px" }} />

      {/* Center button */}
      <Button
        variant="secondary"
        size="sm"
        className="absolute bottom-4 right-4 z-[1000] shadow-md"
        onClick={centerOnUserLocation}
      >
        <Navigation className="h-4 w-4 mr-1" />
        Centralizar
      </Button>

      {/* Legend */}
      <div className="absolute top-4 left-4 z-[1000] bg-card/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
        <p className="text-xs font-medium text-foreground mb-1">Legenda</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
            <span className="text-muted-foreground">Agendado</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span className="text-muted-foreground">Em Andamento</span>
          </div>
        </div>
      </div>

      {filteredServicos.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[1000]">
          <p className="text-sm text-muted-foreground">Nenhum serviço ativo para exibir</p>
        </div>
      )}
    </div>
  );
}
