import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, MessageCircle } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Colaborador, Servico } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { openWhatsApp } from "@/lib/whatsapp";

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useLocalStorage<Colaborador[]>("colaboradores", []);
  const [servicos] = useLocalStorage<Servico[]>("servicos", []);
  const [search, setSearch] = useState("");

  // Função para contar serviços por colaborador
  const getServicosCount = (colaboradorId: string) => {
    const servicosColaborador = servicos.filter(s => s.colaboradorId === colaboradorId);
    const total = servicosColaborador.length;
    const concluidos = servicosColaborador.filter(s => s.status === "concluido").length;
    return { total, concluidos };
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    funcao: "",
    ativo: true,
  });

  const filteredColaboradores = colaboradores.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.funcao.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingColaborador) {
      setColaboradores(
        colaboradores.map((c) =>
          c.id === editingColaborador.id
            ? { ...c, ...form }
            : c
        )
      );
      toast({
        title: "Colaborador atualizado!",
        description: `${form.nome} foi atualizado com sucesso.`,
      });
    } else {
      const newColaborador: Colaborador = {
        id: crypto.randomUUID(),
        ...form,
        dataCadastro: new Date(),
      };
      setColaboradores([...colaboradores, newColaborador]);
      toast({
        title: "Colaborador cadastrado!",
        description: `${form.nome} foi adicionado à equipe.`,
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setForm({
      nome: "",
      email: "",
      telefone: "",
      funcao: "",
      ativo: true,
    });
    setEditingColaborador(null);
  };

  const handleEdit = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador);
    setForm({
      nome: colaborador.nome,
      email: colaborador.email,
      telefone: colaborador.telefone,
      funcao: colaborador.funcao,
      ativo: colaborador.ativo,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setColaboradores(colaboradores.filter((c) => c.id !== id));
    toast({
      title: "Colaborador removido",
      description: "O colaborador foi removido da equipe.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Colaboradores</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua equipe de trabalho</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingColaborador ? "Editar Colaborador" : "Novo Colaborador"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Digite o nome"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="funcao">Função</Label>
                <Input
                  id="funcao"
                  value={form.funcao}
                  onChange={(e) => setForm({ ...form, funcao: e.target.value })}
                  placeholder="Ex: Pintor, Pedreiro"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ativo">Colaborador Ativo</Label>
                <Switch
                  id="ativo"
                  checked={form.ativo}
                  onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingColaborador ? "Salvar Alterações" : "Cadastrar Colaborador"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar colaborador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        {filteredColaboradores.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">
              {search ? "Nenhum colaborador encontrado" : "Nenhum colaborador cadastrado"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Nome</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Função</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Contato</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Serviços</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredColaboradores.map((colaborador) => (
                  <tr key={colaborador.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {colaborador.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">{colaborador.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{colaborador.funcao}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-foreground">{colaborador.email}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-muted-foreground">{colaborador.telefone}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => openWhatsApp(colaborador.telefone)}
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const { total, concluidos } = getServicosCount(colaborador.id);
                        return (
                          <Badge variant="outline" className="text-xs">
                            {total > 0 ? `${total} / ${concluidos} ✓` : "0"}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={colaborador.ativo ? "default" : "secondary"}>
                        {colaborador.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(colaborador)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(colaborador.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
