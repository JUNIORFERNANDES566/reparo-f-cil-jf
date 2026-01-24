import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  TrendingUp, 
  ChevronRight,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  MapPin
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Colaborador, Cliente, Servico, AppConfig } from "@/types";
import { WeatherWidget } from "@/components/WeatherWidget";
import { WeatherForecastWidget } from "@/components/WeatherForecastWidget";
import { CitySearch } from "@/components/CitySearch";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const defaultConfig: AppConfig = {
  openWeatherApiKey: "",
  empresaNome: "",
  empresaCnpj: "",
  empresaEndereco: "",
  empresaTelefone: "",
  empresaEmail: "",
};

const statusColors = {
  agendado: "#3b82f6",
  em_andamento: "#f59e0b",
  concluido: "#22c55e",
  cancelado: "#ef4444",
};

const statusLabels = {
  agendado: "Agendado",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [colaboradores] = useLocalStorage<Colaborador[]>("colaboradores", []);
  const [clientes] = useLocalStorage<Cliente[]>("clientes", []);
  const [servicos] = useLocalStorage<Servico[]>("servicos", []);
  const [config] = useLocalStorage<AppConfig>("appConfig", defaultConfig);
  
  const [showServicosChart, setShowServicosChart] = useState(false);
  const [showFaturamentoChart, setShowFaturamentoChart] = useState(false);

  const geolocation = useGeolocation();
  const [currentCity, setCurrentCity] = useState<string>("");
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLon, setCurrentLon] = useState<number | null>(null);

  useEffect(() => {
    if (!geolocation.loading && geolocation.city) {
      setCurrentCity(geolocation.city);
      setCurrentLat(geolocation.latitude);
      setCurrentLon(geolocation.longitude);
    }
  }, [geolocation.loading, geolocation.city, geolocation.latitude, geolocation.longitude]);

  const handleCitySelect = (city: string, lat: number, lon: number) => {
    setCurrentCity(city);
    setCurrentLat(lat);
    setCurrentLon(lon);
  };

  const colaboradoresAtivos = colaboradores.filter(c => c.ativo).length;
  const servicosMes = servicos.filter(s => {
    const dataServico = new Date(s.data);
    const now = new Date();
    return dataServico.getMonth() === now.getMonth() && dataServico.getFullYear() === now.getFullYear();
  });
  const faturamentoMes = servicosMes.filter(s => s.status === "concluido").reduce((acc, s) => acc + s.valor, 0);

  const lastMonth = subMonths(new Date(), 1);
  const servicosLastMonth = servicos.filter(s => {
    const dataServico = new Date(s.data);
    return dataServico.getMonth() === lastMonth.getMonth() && dataServico.getFullYear() === lastMonth.getFullYear();
  });
  const faturamentoLastMonth = servicosLastMonth.filter(s => s.status === "concluido").reduce((acc, s) => acc + s.valor, 0);

  const servicosChange = servicosLastMonth.length > 0 
    ? ((servicosMes.length - servicosLastMonth.length) / servicosLastMonth.length * 100).toFixed(0)
    : servicosMes.length > 0 ? "+100" : "0";
  const faturamentoChange = faturamentoLastMonth > 0 
    ? ((faturamentoMes - faturamentoLastMonth) / faturamentoLastMonth * 100).toFixed(0)
    : faturamentoMes > 0 ? "+100" : "0";

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthServicos = servicos.filter(s => {
      const dataServico = new Date(s.data);
      return isWithinInterval(dataServico, { start: monthStart, end: monthEnd });
    });
    
    const monthFaturamento = monthServicos
      .filter(s => s.status === "concluido")
      .reduce((acc, s) => acc + s.valor, 0);

    return {
      month: format(date, "MMM", { locale: ptBR }),
      servicos: monthServicos.length,
      faturamento: monthFaturamento,
    };
  });

  const statusData = Object.entries(statusColors).map(([status, color]) => ({
    name: statusLabels[status as keyof typeof statusLabels],
    value: servicosMes.filter(s => s.status === status).length,
    color,
  })).filter(d => d.value > 0);

  const weatherCity = currentCity.split(",")[0]?.trim() || "Pelotas";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do seu negócio</p>
        </div>
        
        <div className="lg:max-w-xs w-full">
          <WeatherWidget city={weatherCity} />
        </div>
      </div>

      {config.openWeatherApiKey && (
        <div className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium text-foreground">Previsão do Tempo</h3>
          </div>
          <CitySearch onCitySelect={handleCitySelect} currentCity={currentCity} />
          <div className="mt-4">
            <WeatherForecastWidget city={weatherCity} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => navigate("/clientes")} className="cursor-pointer group">
          <StatCard
            title="Total de Clientes"
            value={clientes.length}
            icon={Users}
            variant="primary"
          />
        </div>
        
        <div onClick={() => navigate("/colaboradores")} className="cursor-pointer group">
          <StatCard
            title="Colaboradores Ativos"
            value={colaboradoresAtivos}
            icon={UserCheck}
            variant="accent"
          />
        </div>
        
        <div onClick={() => setShowServicosChart(true)} className="cursor-pointer group">
          <div className="relative">
            <StatCard
              title="Serviços este Mês"
              value={servicosMes.length}
              icon={Briefcase}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs">
              {Number(servicosChange) >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={Number(servicosChange) >= 0 ? "text-green-500" : "text-red-500"}>
                {servicosChange}%
              </span>
            </div>
          </div>
        </div>
        
        <div onClick={() => setShowFaturamentoChart(true)} className="cursor-pointer group">
          <div className="relative">
            <StatCard
              title="Faturamento Mês"
              value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(faturamentoMes)}
              icon={TrendingUp}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs">
              {Number(faturamentoChange) >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={Number(faturamentoChange) >= 0 ? "text-green-500" : "text-red-500"}>
                {faturamentoChange}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate("/clientes")}
        >
          <Users className="h-5 w-5 text-primary" />
          <span>Ver Clientes</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate("/colaboradores")}
        >
          <UserCheck className="h-5 w-5 text-accent" />
          <span>Ver Colaboradores</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate("/agenda")}
        >
          <CalendarDays className="h-5 w-5 text-primary" />
          <span>Ver Agenda</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => navigate("/orcamentos")}
        >
          <Briefcase className="h-5 w-5 text-accent" />
          <span>Ver Orçamentos</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">
              Últimos Colaboradores
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={() => navigate("/colaboradores")}
            >
              Ver todos <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {colaboradores.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum colaborador cadastrado</p>
          ) : (
            <div className="space-y-3">
              {colaboradores.slice(0, 5).map((colab) => (
                <div key={colab.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {colab.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{colab.nome}</p>
                    <p className="text-sm text-muted-foreground">{colab.funcao}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${colab.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {colab.ativo ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">
              Últimos Clientes
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1"
              onClick={() => navigate("/clientes")}
            >
              Ver todos <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {clientes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum cliente cadastrado</p>
          ) : (
            <div className="space-y-3">
              {clientes.slice(0, 5).map((cliente) => (
                <div key={cliente.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-accent font-semibold">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{cliente.nome}</p>
                    <p className="text-sm text-muted-foreground">{cliente.cidade}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showServicosChart} onOpenChange={setShowServicosChart}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Serviços - Últimos 6 Meses</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="servicos" name="Serviços" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {statusData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Status dos Serviços (Este Mês)</h3>
                <div className="h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFaturamentoChart} onOpenChange={setShowFaturamentoChart}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Faturamento - Últimos 6 Meses</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    className="text-xs"
                    tickFormatter={(value) => 
                      new Intl.NumberFormat("pt-BR", { 
                        style: "currency", 
                        currency: "BRL",
                        notation: "compact"
                      }).format(value)
                    }
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [
                      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value),
                      "Faturamento"
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="faturamento" 
                    stroke="hsl(32 95% 44%)" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(32 95% 44%)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
