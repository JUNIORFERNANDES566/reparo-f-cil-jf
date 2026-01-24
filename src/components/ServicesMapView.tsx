import { MapPin } from "lucide-react";
import { Servico, Cliente } from "@/types";

interface ServicesMapViewProps {
  servicos: Servico[];
  clientes: Cliente[];
  onServicoSelect?: (servico: Servico) => void;
}

export function ServicesMapView({ servicos, clientes, onServicoSelect }: ServicesMapViewProps) {
  // Simplified map view - in production would use Leaflet/React-Leaflet
  const getClienteEndereco = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? `${cliente.endereco}, ${cliente.cidade}` : "Endereço não encontrado";
  };

  if (servicos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhum serviço para exibir no mapa</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary/30 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-medium text-foreground">Localizações dos Serviços</h3>
      </div>
      <div className="space-y-3">
        {servicos.slice(0, 5).map((servico) => (
          <div
            key={servico.id}
            onClick={() => onServicoSelect?.(servico)}
            className="flex items-start gap-3 p-3 rounded-lg bg-card hover:bg-accent/10 cursor-pointer transition-colors"
          >
            <MapPin className="h-4 w-4 text-primary mt-1 shrink-0" />
            <div>
              <p className="font-medium text-foreground">{servico.titulo}</p>
              <p className="text-sm text-muted-foreground">{getClienteEndereco(servico.clienteId)}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Mapa interativo requer integração com Leaflet
      </p>
    </div>
  );
}
