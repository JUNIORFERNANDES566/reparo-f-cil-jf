import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, FileText, Copy, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Cliente, Orcamento, ItemOrcamento, StatusOrcamento, TipoOrcamento, TipoItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { openWhatsApp } from "@/lib/whatsapp";

const statusConfig: Record<StatusOrcamento, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-warning/10 text-warning border-warning/20" },
  aprovado: { label: "Aprovado", className: "bg-success/10 text-success border-success/20" },
  recusado: { label: "Recusado", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useLocalStorage<Orcamento[]>("orcamentos", []);
  const [clientes] = useLocalStorage<Cliente[]>("clientes", []);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<Orcamento | null>(null);
  const [previewOrcamento, setPreviewOrcamento] = useState<Orcamento | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    clienteId: "",
    tipoOrcamento: "simplificado" as TipoOrcamento,
    titulo: "",
    descricao: "",
    valorTotal: "",
    validade: "",
    status: "pendente" as StatusOrcamento,
  });

  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [novoItem, setNovoItem] = useState({
    descricao: "",
    quantidade: "1",
    unidade: "un",
    valorUnitario: "",
    tipo: "material" as TipoItem,
  });

  const getNextNumero = () => {
    const year = new Date().getFullYear();
    const count = orcamentos.filter(o => o.numero.includes(year.toString())).length + 1;
    return `ORC-${year}-${count.toString().padStart(3, "0")}`;
  };

  const filteredOrcamentos = orcamentos.filter(
    (o) =>
      o.numero.toLowerCase().includes(search.toLowerCase()) ||
      o.titulo.toLowerCase().includes(search.toLowerCase()) ||
      clientes.find(c => c.id === o.clienteId)?.nome.toLowerCase().includes(search.toLowerCase())
  );

  const calculateTotal = (items: ItemOrcamento[]) =>
    items.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);

  const handleAddItem = () => {
    if (!novoItem.descricao || !novoItem.valorUnitario) return;

    const item: ItemOrcamento = {
      id: crypto.randomUUID(),
      descricao: novoItem.descricao,
      quantidade: parseFloat(novoItem.quantidade) || 1,
      unidade: novoItem.unidade,
      valorUnitario: parseFloat(novoItem.valorUnitario) || 0,
      tipo: novoItem.tipo,
    };

    setItens([...itens, item]);
    setNovoItem({
      descricao: "",
      quantidade: "1",
      unidade: "un",
      valorUnitario: "",
      tipo: "material",
    });
  };

  const handleRemoveItem = (id: string) => {
    setItens(itens.filter((i) => i.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const valorTotal = form.tipoOrcamento === "simplificado"
      ? parseFloat(form.valorTotal) || 0
      : calculateTotal(itens);

    const orcamentoData = {
      clienteId: form.clienteId,
      tipoOrcamento: form.tipoOrcamento,
      titulo: form.titulo,
      descricao: form.descricao,
      itens: form.tipoOrcamento === "detalhado" ? itens : [],
      valorTotal,
      validade: form.validade,
      status: form.status,
    };

    if (editingOrcamento) {
      setOrcamentos(
        orcamentos.map((o) =>
          o.id === editingOrcamento.id ? { ...o, ...orcamentoData } : o
        )
      );
      toast({
        title: "Orçamento atualizado!",
        description: `${editingOrcamento.numero} foi atualizado.`,
      });
    } else {
      const newOrcamento: Orcamento = {
        id: crypto.randomUUID(),
        numero: getNextNumero(),
        ...orcamentoData,
        dataCadastro: new Date(),
      };
      setOrcamentos([...orcamentos, newOrcamento]);
      toast({
        title: "Orçamento criado!",
        description: `${newOrcamento.numero} foi gerado com sucesso.`,
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setForm({
      clienteId: "",
      tipoOrcamento: "simplificado",
      titulo: "",
      descricao: "",
      valorTotal: "",
      validade: "",
      status: "pendente",
    });
    setItens([]);
    setEditingOrcamento(null);
  };

  const handleEdit = (orcamento: Orcamento) => {
    setEditingOrcamento(orcamento);
    setForm({
      clienteId: orcamento.clienteId,
      tipoOrcamento: orcamento.tipoOrcamento,
      titulo: orcamento.titulo,
      descricao: orcamento.descricao,
      valorTotal: orcamento.valorTotal.toString(),
      validade: orcamento.validade,
      status: orcamento.status,
    });
    setItens(orcamento.itens || []);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setOrcamentos(orcamentos.filter((o) => o.id !== id));
    toast({
      title: "Orçamento removido",
      description: "O orçamento foi excluído.",
      variant: "destructive",
    });
  };

  const handleDuplicate = (orcamento: Orcamento) => {
    const newOrcamento: Orcamento = {
      ...orcamento,
      id: crypto.randomUUID(),
      numero: getNextNumero(),
      status: "pendente",
      dataCadastro: new Date(),
    };
    setOrcamentos([...orcamentos, newOrcamento]);
    toast({
      title: "Orçamento duplicado!",
      description: `${newOrcamento.numero} foi criado.`,
    });
  };

  const handleShareWhatsApp = (orcamento: Orcamento) => {
    const cliente = clientes.find(c => c.id === orcamento.clienteId);
    if (!cliente) {
      toast({
        title: "Erro",
        description: "Cliente não encontrado.",
        variant: "destructive",
      });
      return;
    }

    let message = `*${orcamento.numero}*\n\n`;
    message += `Olá ${cliente.nome.split(" ")[0]}, segue seu orçamento:\n\n`;
    message += `📋 *${orcamento.titulo}*\n`;
    
    if (orcamento.tipoOrcamento === "detalhado" && orcamento.itens.length > 0) {
      message += `\n📝 *Itens:*\n`;
      orcamento.itens.forEach(item => {
        message += `• ${item.descricao}: ${item.quantidade} ${item.unidade} x ${formatCurrency(item.valorUnitario)} = ${formatCurrency(item.quantidade * item.valorUnitario)}\n`;
      });
    }
    
    message += `\n💰 *Total: ${formatCurrency(orcamento.valorTotal)}*\n`;
    message += `📅 Válido até: ${format(new Date(orcamento.validade), "dd/MM/yyyy")}\n`;
    
    if (orcamento.descricao) {
      message += `\n📄 ${orcamento.descricao}`;
    }

    openWhatsApp(cliente.telefone, message);
  };

  const getClienteName = (id: string) => clientes.find((c) => c.id === id)?.nome || "Cliente não encontrado";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Orçamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie propostas e orçamentos</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingOrcamento ? `Editar ${editingOrcamento.numero}` : "Novo Orçamento"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={form.clienteId} onValueChange={(v) => setForm({ ...form, clienteId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Tabs value={form.tipoOrcamento} onValueChange={(v) => setForm({ ...form, tipoOrcamento: v as TipoOrcamento })}>
                    <TabsList className="w-full">
                      <TabsTrigger value="simplificado" className="flex-1">Simplificado</TabsTrigger>
                      <TabsTrigger value="detalhado" className="flex-1">Detalhado</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Pintura completa do apartamento"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Validade</Label>
                  <Input
                    type="date"
                    value={form.validade}
                    onChange={(e) => setForm({ ...form, validade: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v: StatusOrcamento) => setForm({ ...form, status: v })}>
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

              {form.tipoOrcamento === "simplificado" ? (
                <div className="space-y-2">
                  <Label>Valor Total (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.valorTotal}
                    onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-secondary/30">
                    <h4 className="font-medium mb-3">Adicionar Item</h4>
                    <div className="grid grid-cols-6 gap-2">
                      <div className="col-span-2">
                        <Input
                          placeholder="Descrição"
                          value={novoItem.descricao}
                          onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                        />
                      </div>
                      <Input
                        type="number"
                        placeholder="Qtd"
                        value={novoItem.quantidade}
                        onChange={(e) => setNovoItem({ ...novoItem, quantidade: e.target.value })}
                      />
                      <Input
                        placeholder="Un"
                        value={novoItem.unidade}
                        onChange={(e) => setNovoItem({ ...novoItem, unidade: e.target.value })}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Valor"
                        value={novoItem.valorUnitario}
                        onChange={(e) => setNovoItem({ ...novoItem, valorUnitario: e.target.value })}
                      />
                      <Select value={novoItem.tipo} onValueChange={(v: TipoItem) => setNovoItem({ ...novoItem, tipo: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="material">Material</SelectItem>
                          <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleAddItem}>
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>

                  {itens.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/50">
                          <tr>
                            <th className="text-left px-3 py-2">Descrição</th>
                            <th className="text-center px-3 py-2">Tipo</th>
                            <th className="text-center px-3 py-2">Qtd</th>
                            <th className="text-right px-3 py-2">Unit.</th>
                            <th className="text-right px-3 py-2">Total</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {itens.map((item) => (
                            <tr key={item.id}>
                              <td className="px-3 py-2">{item.descricao}</td>
                              <td className="px-3 py-2 text-center">
                                <Badge variant="outline" className="text-xs">
                                  {item.tipo === "material" ? "Material" : "M.O."}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-center">{item.quantidade} {item.unidade}</td>
                              <td className="px-3 py-2 text-right">{formatCurrency(item.valorUnitario)}</td>
                              <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.quantidade * item.valorUnitario)}</td>
                              <td className="px-2">
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveItem(item.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-secondary/30">
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-right font-semibold">Total:</td>
                            <td className="px-3 py-2 text-right font-bold">{formatCurrency(calculateTotal(itens))}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Descrição / Observações</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Detalhes adicionais do orçamento..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">
                {editingOrcamento ? "Salvar Alterações" : "Criar Orçamento"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar orçamento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrcamentos.length === 0 ? (
          <div className="col-span-full bg-card rounded-xl p-12 text-center shadow-card">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {search ? "Nenhum orçamento encontrado" : "Nenhum orçamento cadastrado"}
            </p>
          </div>
        ) : (
          filteredOrcamentos.map((orcamento) => (
            <div key={orcamento.id} className="bg-card rounded-xl p-6 shadow-card card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">{orcamento.numero}</p>
                  <h3 className="font-semibold text-foreground mt-1">{orcamento.titulo}</h3>
                  <p className="text-sm text-muted-foreground">{getClienteName(orcamento.clienteId)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => setPreviewOrcamento(orcamento)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShareWhatsApp(orcamento)}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Enviar WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(orcamento)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(orcamento)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(orcamento.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(orcamento.valorTotal)}
                </span>
                <Badge variant="outline" className={cn("text-xs", statusConfig[orcamento.status].className)}>
                  {statusConfig[orcamento.status].label}
                </Badge>
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {orcamento.tipoOrcamento === "detalhado" ? `${orcamento.itens.length} itens` : "Simplificado"}
                </span>
                <span>Válido até {format(new Date(orcamento.validade), "dd/MM/yyyy")}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Preview */}
      <Dialog open={!!previewOrcamento} onOpenChange={() => setPreviewOrcamento(null)}>
        <DialogContent className="sm:max-w-lg">
          {previewOrcamento && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">{previewOrcamento.numero}</p>
                    <DialogTitle className="font-display mt-1">{previewOrcamento.titulo}</DialogTitle>
                  </div>
                  <Badge variant="outline" className={cn(statusConfig[previewOrcamento.status].className)}>
                    {statusConfig[previewOrcamento.status].label}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{getClienteName(previewOrcamento.clienteId)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Validade</p>
                    <p className="font-medium">{format(new Date(previewOrcamento.validade), "dd/MM/yyyy")}</p>
                  </div>
                </div>

                {previewOrcamento.tipoOrcamento === "detalhado" && previewOrcamento.itens.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="text-left px-3 py-2">Item</th>
                          <th className="text-center px-3 py-2">Qtd</th>
                          <th className="text-right px-3 py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {previewOrcamento.itens.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{item.descricao}</td>
                            <td className="px-3 py-2 text-center">{item.quantidade} {item.unidade}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.quantidade * item.valorUnitario)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="p-4 bg-primary/5 rounded-lg flex items-center justify-between">
                  <span className="font-medium">Valor Total</span>
                  <span className="text-xl font-bold">{formatCurrency(previewOrcamento.valorTotal)}</span>
                </div>

                {previewOrcamento.descricao && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="text-sm mt-1">{previewOrcamento.descricao}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleShareWhatsApp(previewOrcamento)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar WhatsApp
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
