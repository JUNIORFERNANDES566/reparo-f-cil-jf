import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, MapPin, MessageCircle, FileText, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Cliente } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { openWhatsApp } from "@/lib/whatsapp";

export default function Clientes() {
  const [clientes, setClientes] = useLocalStorage<Cliente[]>("clientes", []);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [showNotes, setShowNotes] = useState<string | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    cidade: "",
    cpfCnpj: "",
    anotacoes: "",
  });

  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.cidade.toLowerCase().includes(search.toLowerCase()) ||
      c.cpfCnpj?.includes(search)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCliente) {
      setClientes(
        clientes.map((c) =>
          c.id === editingCliente.id
            ? { ...c, ...form }
            : c
        )
      );
      toast({
        title: "Cliente atualizado!",
        description: `${form.nome} foi atualizado com sucesso.`,
      });
    } else {
      const newCliente: Cliente = {
        id: crypto.randomUUID(),
        ...form,
        dataCadastro: new Date(),
      };
      setClientes([...clientes, newCliente]);
      toast({
        title: "Cliente cadastrado!",
        description: `${form.nome} foi adicionado à sua carteira.`,
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
      endereco: "",
      cidade: "",
      cpfCnpj: "",
      anotacoes: "",
    });
    setEditingCliente(null);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setForm({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      cidade: cliente.cidade,
      cpfCnpj: cliente.cpfCnpj || "",
      anotacoes: cliente.anotacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setClientes(clientes.filter((c) => c.id !== id));
    toast({
      title: "Cliente removido",
      description: "O cliente foi removido da carteira.",
      variant: "destructive",
    });
  };

  const formatCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      return digits
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua carteira de clientes</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingCliente ? "Editar Cliente" : "Novo Cliente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
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
                  <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
                  <Input
                    id="cpfCnpj"
                    value={form.cpfCnpj}
                    onChange={(e) => setForm({ ...form, cpfCnpj: formatCpfCnpj(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={18}
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
                <div className="sm:col-span-2 space-y-2">
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
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="endereco">Endereço Completo</Label>
                  <Input
                    id="endereco"
                    value={form.endereco}
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                    placeholder="Rua, número, bairro, CEP"
                    required
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="cidade">Cidade - UF</Label>
                  <Input
                    id="cidade"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    placeholder="Cidade - UF"
                    required
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="anotacoes">Anotações</Label>
                  <Textarea
                    id="anotacoes"
                    value={form.anotacoes}
                    onChange={(e) => setForm({ ...form, anotacoes: e.target.value })}
                    placeholder="Observações sobre o cliente..."
                    rows={3}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingCliente ? "Salvar Alterações" : "Cadastrar Cliente"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, cidade ou CPF/CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClientes.length === 0 ? (
          <div className="col-span-full bg-card rounded-xl p-12 text-center shadow-card">
            <p className="text-muted-foreground">
              {search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </p>
          </div>
        ) : (
          filteredClientes.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-card rounded-xl p-6 shadow-card card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-accent font-bold text-lg">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{cliente.nome}</h3>
                    <p className="text-sm text-muted-foreground">{cliente.email}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(cliente)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {cliente.anotacoes && (
                      <DropdownMenuItem onClick={() => setShowNotes(cliente.id)}>
                        <StickyNote className="h-4 w-4 mr-2" />
                        Ver Anotações
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDelete(cliente.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 space-y-2">
                {cliente.cpfCnpj && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span>{cliente.cpfCnpj}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => openWhatsApp(cliente.telefone)}
                    title="Abrir WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{cliente.endereco}, {cliente.cidade}</span>
                </div>
                {cliente.anotacoes && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <StickyNote className="h-4 w-4 shrink-0" />
                    <span className="truncate">{cliente.anotacoes}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={!!showNotes} onOpenChange={() => setShowNotes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Anotações do Cliente</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-foreground whitespace-pre-wrap">
              {clientes.find(c => c.id === showNotes)?.anotacoes}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
