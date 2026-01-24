import { useState, useMemo } from "react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Colaborador, Cliente, Servico, StatusServico } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const statusConfig: Record<StatusServico, { label: string; className: string }> = {
  agendado: { label: "Agendado", className: "bg-primary/10 text-primary border-primary/20" },
  em_andamento: { label: "Em Andamento", className: "bg-warning/10 text-warning border-warning/20" },
  concluido: { label: "Concluído", className: "bg-green-100 text-green-700 border-green-200" },
  cancelado: { label: "Cancelado", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const tiposServico = [
  "Pintura Interna",
  "Pintura Externa",
  "Pintura de Fachada",
  "Reparo de Alvenaria",
  "Impermeabilização",
  "Manutenção Geral",
  "Troca de Pisos",
  "Reparos Hidráulicos",
  "Reparos Elétricos",
  "Outros",
];

export default function Agenda() {
  const [servicos, setServicos] = useLocalStorage<Servico[]>("servicos", []);
  const [colaboradores] = useLocalStorage<Colaborador[]>("colaboradores", []);
  const [clientes] = useLocalStorage<Cliente[]>("clientes", []);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    clienteId: "",
    colaboradorId: "",
    data: "",
    horario: "",
    valor: "",
    status: "agendado" as StatusServico,
    tipoServico: "",
  });

  const colaboradoresAtivos = colaboradores.filter((c) => c.ativo);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startDayOfWeek = getDay(startOfMonth(currentMonth));

  const getServicosForDay = (date: Date) => {
    return servicos.filter((s) => isSameDay(parseISO(s.data), date));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const servicoData = {
      titulo: form.titulo,
      descricao: form.descricao,
      clienteId: form.clienteId,
      colaboradorId: form.colaboradorId,
      data: form.data,
      horario: form.horario,
      valor: parseFloat(form.valor) || 0,
      status: form.status,
      tipoServico: form.tipoServico,
    };

    if (editingServico) {
      setServicos(
        servicos.map((s) =>
          s.id === editingServico.id ? { ...s, ...servicoData } : s
        )
      );
      toast({
        title: "Serviço atualizado!",
        description: `${form.titulo} foi atualizado com sucesso.`,
      });
    } else {
      const newServico: Servico = {
        id: crypto.randomUUID(),
        ...servicoData,
        dataCadastro: new Date(),
      };
      setServicos([...servicos, newServico]);
      toast({
        title: "Serviço agendado!",
        description: `${form.titulo} foi agendado para ${format(parseISO(form.data), "dd/MM/yyyy", { locale: ptBR })}.`,
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setForm({
      titulo: "",
      descricao: "",
      clienteId: "",
      colaboradorId: "",
      data: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
      horario: "",
      valor: "",
      status: "agendado",
      tipoServico: "",
    });
    setEditingServico(null);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setForm((prev) => ({ ...prev, data: format(date, "yyyy-MM-dd") }));
  };

  const handleNewServico = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (servico: Servico) => {
    setEditingServico(servico);
    setForm({
      titulo: servico.titulo,
      descricao: servico.descricao,
      clienteId: servico.clienteId,
      colaboradorId: servico.colaboradorId,
      data: servico.data,
      horario: servico.horario,
      valor: servico.valor.toString(),
      status: servico.status,
      tipoServico: servico.tipoServico,
    });
    setSelectedServico(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setServicos(servicos.filter((s) => s.id !== id));
    setSelectedServico(null);
    toast({
      title: "Serviço removido",
      description: "O serviço foi removido da agenda.",
      variant: "destructive",
    });
  };

  const getClienteName = (id: string) => clientes.find((c) => c.id === id)?.nome || "Cliente não encontrado";
  const getColaboradorName = (id: string) => colaboradores.find((c) => c.id === id)?.nome || "Colaborador não encontrado";

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Agenda de Serviços</h1>
          <p className="text-muted-foreground mt-1">Organize os trabalhos da sua equipe</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleNewServico}>
              <Plus className="h-4 w-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingServico ? "Editar Serviço" : "Agendar Novo Serviço"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do Serviço</Label>
                <Input
                  id="titulo"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Pintura do apartamento 301"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoServico">Tipo de Serviço</Label>
                  <Select value={form.tipoServico} onValueChange={(value) => setForm({ ...form, tipoServico: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {tiposServico.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={form.status} onValueChange={(value: StatusServico) => setForm({ ...form, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clienteId">Cliente</Label>
                <Select value={form.clienteId} onValueChange={(value) => setForm({ ...form, clienteId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {clientes.length === 0 ? (
                      <SelectItem value="none" disabled>Nenhum cliente cadastrado</SelectItem>
                    ) : (
                      clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colaboradorId">Colaborador Responsável</Label>
                <Select value={form.colaboradorId} onValueChange={(value) => setForm({ ...form, colaboradorId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o colaborador" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {colaboradoresAtivos.length === 0 ? (
                      <SelectItem value="none" disabled>Nenhum colaborador ativo</SelectItem>
                    ) : (
                      colaboradoresAtivos.map((colab) => (
                        <SelectItem key={colab.id} value={colab.id}>{colab.nome} - {colab.funcao}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horario">Horário</Label>
                  <Input
                    id="horario"
                    type="time"
                    value={form.horario}
                    onChange={(e) => setForm({ ...form, horario: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Detalhes do serviço..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingServico ? "Salvar Alterações" : "Agendar Serviço"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-foreground">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7">
          {weekDays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground bg-secondary/50">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 min-h-24 border-t border-r" />
          ))}
          {daysInMonth.map((day) => {
            const dayServicos = getServicosForDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "p-2 min-h-24 border-t border-r cursor-pointer hover:bg-secondary/30 transition-colors",
                  isToday && "bg-primary/5",
                  isSelected && "ring-2 ring-primary ring-inset"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  isToday && "text-primary"
                )}>
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-1">
                  {dayServicos.slice(0, 2).map((servico) => (
                    <div
                      key={servico.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedServico(servico);
                      }}
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded truncate",
                        statusConfig[servico.status].className
                      )}
                    >
                      {servico.titulo}
                    </div>
                  ))}
                  {dayServicos.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayServicos.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Service Details */}
      <Dialog open={!!selectedServico} onOpenChange={() => setSelectedServico(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{selectedServico?.titulo}</DialogTitle>
          </DialogHeader>
          {selectedServico && (
            <div className="space-y-4 mt-4">
              <Badge className={statusConfig[selectedServico.status].className}>
                {statusConfig[selectedServico.status].label}
              </Badge>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{format(parseISO(selectedServico.data), "dd/MM/yyyy")} às {selectedServico.horario}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{getClienteName(selectedServico.clienteId)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{getColaboradorName(selectedServico.colaboradorId)}</span>
                </div>
              </div>

              {selectedServico.descricao && (
                <p className="text-foreground">{selectedServico.descricao}</p>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => handleEdit(selectedServico)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => handleDelete(selectedServico.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
