import { useState, useMemo, useRef } from "react";
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, MoreHorizontal, Edit, Trash2, X, Upload, FileText, Image as ImageIcon, Camera, Map, CalendarDays } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Colaborador, Cliente, Servico, StatusServico, Documento, TipoDocumento } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ServicesMapView } from "@/components/ServicesMapView";
import { geocodeAddress } from "@/lib/geocoding";

const statusConfig: Record<StatusServico, { label: string; className: string }> = {
  agendado: { label: "Agendado", className: "bg-primary/10 text-primary border-primary/20" },
  em_andamento: { label: "Em Andamento", className: "bg-warning/10 text-warning border-warning/20" },
  concluido: { label: "Concluído", className: "bg-success/10 text-success border-success/20" },
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    apartamento: "",
  });

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [fotosAntes, setFotosAntes] = useState<Documento[]>([]);
  const [fotosDepois, setFotosDepois] = useState<Documento[]>([]);
  const [activeTab, setActiveTab] = useState("calendario");
  const fotosAntesRef = useRef<HTMLInputElement>(null);
  const fotosDepoisRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build address string for geocoding
    const addressParts = [form.rua, form.numero].filter(Boolean);
    const addressString = addressParts.length > 0
      ? `${addressParts.join(", ")}${form.cep ? ` - ${form.cep}` : ""}`
      : "";

    let latitude: number | undefined;
    let longitude: number | undefined;

    if (addressString) {
      try {
        const result = await geocodeAddress(addressString);
        if (result) {
          latitude = result.lat;
          longitude = result.lon;
        }
      } catch {
        console.warn("Geocoding failed, saving without coordinates");
      }
    }

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
      documentos: documentos,
      fotosAntes: fotosAntes,
      fotosDepois: fotosDepois,
      cep: form.cep,
      rua: form.rua,
      numero: form.numero,
      complemento: form.complemento,
      apartamento: form.apartamento,
      latitude,
      longitude,
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
      cep: "",
      rua: "",
      numero: "",
      complemento: "",
      apartamento: "",
    });
    setDocumentos([]);
    setFotosAntes([]);
    setFotosDepois([]);
    setEditingServico(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, categoria?: TipoDocumento) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const novoDoc: Documento = {
          id: crypto.randomUUID(),
          nome: file.name,
          tipo: file.type,
          dataUrl,
          dataUpload: new Date(),
          categoria: categoria || "geral",
        };
        
        if (categoria === "antes") {
          setFotosAntes((prev) => [...prev, novoDoc]);
        } else if (categoria === "depois") {
          setFotosDepois((prev) => [...prev, novoDoc]);
        } else {
          setDocumentos((prev) => [...prev, novoDoc]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current && !categoria) {
      fileInputRef.current.value = "";
    }
    if (fotosAntesRef.current && categoria === "antes") {
      fotosAntesRef.current.value = "";
    }
    if (fotosDepoisRef.current && categoria === "depois") {
      fotosDepoisRef.current.value = "";
    }
  };

  const handleRemoveDocumento = (id: string, categoria?: TipoDocumento) => {
    if (categoria === "antes") {
      setFotosAntes(fotosAntes.filter((d) => d.id !== id));
    } else if (categoria === "depois") {
      setFotosDepois(fotosDepois.filter((d) => d.id !== id));
    } else {
      setDocumentos(documentos.filter((d) => d.id !== id));
    }
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
      cep: servico.cep || "",
      rua: servico.rua || "",
      numero: servico.numero || "",
      complemento: servico.complemento || "",
      apartamento: servico.apartamento || "",
    });
    setDocumentos(servico.documentos || []);
    setFotosAntes((servico as any).fotosAntes || []);
    setFotosDepois((servico as any).fotosDepois || []);
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

              {/* Endereço de Atendimento */}
              <div className="space-y-3 border rounded-lg p-4 bg-secondary/20">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Endereço de Atendimento</Label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cep" className="text-xs">CEP</Label>
                    <Input
                      id="cep"
                      value={form.cep}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                        setForm({ ...form, cep: val });
                        if (val.length === 8) {
                          fetch(`https://viacep.com.br/ws/${val}/json/`)
                            .then(r => r.json())
                            .then(data => {
                              if (!data.erro) {
                                setForm(prev => ({
                                  ...prev,
                                  cep: val,
                                  rua: data.logradouro || prev.rua,
                                  complemento: data.complemento || prev.complemento,
                                }));
                              }
                            })
                            .catch(() => {});
                        }
                      }}
                      placeholder="00000000"
                      maxLength={8}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="rua" className="text-xs">Rua</Label>
                    <Input
                      id="rua"
                      value={form.rua}
                      onChange={(e) => setForm({ ...form, rua: e.target.value })}
                      placeholder="Nome da rua"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero" className="text-xs">Número</Label>
                    <Input
                      id="numero"
                      value={form.numero}
                      onChange={(e) => setForm({ ...form, numero: e.target.value })}
                      placeholder="Nº"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complemento" className="text-xs">Complemento</Label>
                    <Input
                      id="complemento"
                      value={form.complemento}
                      onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                      placeholder="Bloco, sala..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apartamento" className="text-xs">Apto</Label>
                    <Input
                      id="apartamento"
                      value={form.apartamento}
                      onChange={(e) => setForm({ ...form, apartamento: e.target.value })}
                      placeholder="Apto"
                    />
                  </div>
                </div>
              </div>

              {/* Upload de Documentos */}
              <div className="space-y-2">
                <Label>Documentos Gerais</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm text-muted-foreground">Adicionar documentos</p>
                  </label>
                </div>

                {documentos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {documentos.map((doc) => (
                      <div
                        key={doc.id}
                        className="relative group rounded-lg border overflow-hidden bg-secondary/30"
                      >
                        {doc.tipo.startsWith("image/") ? (
                          <img
                            src={doc.dataUrl}
                            alt={doc.nome}
                            className="w-full h-16 object-cover"
                          />
                        ) : (
                          <div className="w-full h-16 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveDocumento(doc.id)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fotos Antes/Depois para Relatório */}
              <div className="space-y-3 border rounded-lg p-4 bg-secondary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Relatório de Andamento</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Fotos Antes */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Fotos ANTES</p>
                    <div className="border-2 border-dashed border-orange-300 rounded-lg p-3 text-center hover:border-orange-400 transition-colors bg-orange-50/50">
                      <input
                        ref={fotosAntesRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "antes")}
                        className="hidden"
                        id="fotos-antes"
                      />
                      <label htmlFor="fotos-antes" className="cursor-pointer">
                        <Camera className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                        <p className="text-xs text-orange-600">Adicionar fotos</p>
                      </label>
                    </div>
                    {fotosAntes.length > 0 && (
                      <div className="grid grid-cols-2 gap-1">
                        {fotosAntes.map((foto) => (
                          <div key={foto.id} className="relative group rounded border overflow-hidden">
                            <img src={foto.dataUrl} alt={foto.nome} className="w-full h-12 object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveDocumento(foto.id, "antes")}
                              className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fotos Depois */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Fotos DEPOIS</p>
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-3 text-center hover:border-green-400 transition-colors bg-green-50/50">
                      <input
                        ref={fotosDepoisRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "depois")}
                        className="hidden"
                        id="fotos-depois"
                      />
                      <label htmlFor="fotos-depois" className="cursor-pointer">
                        <Camera className="h-5 w-5 mx-auto text-green-500 mb-1" />
                        <p className="text-xs text-green-600">Adicionar fotos</p>
                      </label>
                    </div>
                    {fotosDepois.length > 0 && (
                      <div className="grid grid-cols-2 gap-1">
                        {fotosDepois.map((foto) => (
                          <div key={foto.id} className="relative group rounded border overflow-hidden">
                            <img src={foto.dataUrl} alt={foto.nome} className="w-full h-12 object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveDocumento(foto.id, "depois")}
                              className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingServico ? "Salvar Alterações" : "Agendar Serviço"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs: Calendário / Mapa */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="calendario" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="mapa" className="gap-2">
            <Map className="h-4 w-4" />
            Mapa de Serviços
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendario">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendário */}
            <div className="lg:col-span-2 bg-card rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {daysInMonth.map((date) => {
                const dayServicos = getServicosForDay(date);
                const isToday = isSameDay(date, new Date());
                const isSelected = selectedDate && isSameDay(date, selectedDate);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDayClick(date)}
                    className={cn(
                      "aspect-square p-1 rounded-lg border transition-all hover:bg-secondary/50 relative",
                      isToday && "border-primary",
                      isSelected && "bg-primary/10 border-primary",
                      !isToday && !isSelected && "border-transparent"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      isToday && "text-primary",
                      isSelected && "text-primary"
                    )}>
                      {format(date, "d")}
                    </span>
                    {dayServicos.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayServicos.slice(0, 3).map((s, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              s.status === "agendado" && "bg-primary",
                              s.status === "em_andamento" && "bg-warning",
                              s.status === "concluido" && "bg-success",
                              s.status === "cancelado" && "bg-destructive"
                            )}
                          />
                        ))}
                        {dayServicos.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{dayServicos.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lista de serviços do dia selecionado */}
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-display font-semibold text-foreground">
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                : "Selecione um dia"}
            </h2>
          </div>

          <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Clique em um dia para ver os serviços
              </p>
            ) : getServicosForDay(selectedDate).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum serviço agendado para este dia
              </p>
            ) : (
              getServicosForDay(selectedDate).map((servico) => (
                <div
                  key={servico.id}
                  onClick={() => setSelectedServico(servico)}
                  className="p-3 rounded-lg border bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{servico.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{servico.tipoServico}</p>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0 text-xs", statusConfig[servico.status].className)}>
                      {statusConfig[servico.status].label}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {servico.horario}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {getColaboradorName(servico.colaboradorId).split(" ")[0]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
          </div>
        </TabsContent>

        <TabsContent value="mapa">
          <div className="space-y-4">
            <div className="bg-card rounded-xl shadow-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Map className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-display font-semibold text-foreground">
                  Mapa de Serviços Ativos
                </h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Visualize no mapa os serviços agendados e em andamento. Clique em um marcador para ver os detalhes.
              </p>
              <ServicesMapView
                servicos={servicos}
                clientes={clientes}
                onServicoClick={(servico) => setSelectedServico(servico)}
              />
            </div>

            {/* Lista de serviços ativos */}
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-display font-semibold text-foreground">
                  Serviços Ativos ({servicos.filter(s => s.status === "agendado" || s.status === "em_andamento").length})
                </h3>
              </div>
              <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
                {servicos.filter(s => s.status === "agendado" || s.status === "em_andamento").length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum serviço ativo no momento
                  </p>
                ) : (
                  servicos
                    .filter(s => s.status === "agendado" || s.status === "em_andamento")
                    .map((servico) => (
                      <div
                        key={servico.id}
                        onClick={() => setSelectedServico(servico)}
                        className="p-3 rounded-lg border bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate text-sm">{servico.titulo}</h4>
                            <p className="text-xs text-muted-foreground">
                              {getClienteName(servico.clienteId)} • {format(parseISO(servico.data), "dd/MM")} às {servico.horario}
                            </p>
                          </div>
                          <Badge variant="outline" className={cn("shrink-0 text-xs", statusConfig[servico.status].className)}>
                            {statusConfig[servico.status].label}
                          </Badge>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de detalhes do serviço */}
      <Dialog open={!!selectedServico} onOpenChange={() => setSelectedServico(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedServico && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="font-display">{selectedServico.titulo}</DialogTitle>
                    <Badge variant="outline" className={cn("mt-2", statusConfig[selectedServico.status].className)}>
                      {statusConfig[selectedServico.status].label}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover z-50">
                      <DropdownMenuItem onClick={() => handleEdit(selectedServico)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(selectedServico.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Serviço</p>
                    <p className="font-medium">{selectedServico.tipoServico}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(selectedServico.valor)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-medium">{format(parseISO(selectedServico.data), "dd/MM/yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">{selectedServico.horario}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{getClienteName(selectedServico.clienteId)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Colaborador Responsável</p>
                  <p className="font-medium">{getColaboradorName(selectedServico.colaboradorId)}</p>
                </div>

                {/* Endereço */}
                {(selectedServico.rua || selectedServico.cep) && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Endereço de Atendimento
                    </p>
                    <p className="font-medium">
                      {[
                        selectedServico.rua,
                        selectedServico.numero && `Nº ${selectedServico.numero}`,
                        selectedServico.complemento,
                        selectedServico.apartamento && `Apto ${selectedServico.apartamento}`,
                        selectedServico.cep && `CEP ${selectedServico.cep}`,
                      ].filter(Boolean).join(" - ")}
                    </p>
                  </div>
                )}
                {selectedServico.descricao && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="text-sm">{selectedServico.descricao}</p>
                  </div>
                )}

                {selectedServico.documentos && selectedServico.documentos.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Documentos Anexados</p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedServico.documentos.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.dataUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border overflow-hidden bg-secondary/30 hover:border-primary transition-colors"
                        >
                          {doc.tipo.startsWith("image/") ? (
                            <img
                              src={doc.dataUrl}
                              alt={doc.nome}
                              className="w-full h-14 object-cover"
                            />
                          ) : (
                            <div className="w-full h-14 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relatório de Andamento - Fotos Antes/Depois */}
                {(((selectedServico as any).fotosAntes && (selectedServico as any).fotosAntes.length > 0) || 
                  ((selectedServico as any).fotosDepois && (selectedServico as any).fotosDepois.length > 0)) && (
                  <div className="border rounded-lg p-3 bg-secondary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Relatório de Andamento</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Fotos Antes */}
                      <div>
                        <p className="text-xs font-medium text-orange-600 mb-2 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                          Antes
                        </p>
                        {(selectedServico as any).fotosAntes && (selectedServico as any).fotosAntes.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1">
                            {(selectedServico as any).fotosAntes.map((foto: Documento) => (
                              <a
                                key={foto.id}
                                href={foto.dataUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded border overflow-hidden hover:border-orange-400 transition-colors"
                              >
                                <img src={foto.dataUrl} alt={foto.nome} className="w-full h-16 object-cover" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sem fotos</p>
                        )}
                      </div>

                      {/* Fotos Depois */}
                      <div>
                        <p className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          Depois
                        </p>
                        {(selectedServico as any).fotosDepois && (selectedServico as any).fotosDepois.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1">
                            {(selectedServico as any).fotosDepois.map((foto: Documento) => (
                              <a
                                key={foto.id}
                                href={foto.dataUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded border overflow-hidden hover:border-green-400 transition-colors"
                              >
                                <img src={foto.dataUrl} alt={foto.nome} className="w-full h-16 object-cover" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sem fotos</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
