import { useState } from "react";
import { Save, Building2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AppConfig } from "@/types";
import { useToast } from "@/hooks/use-toast";

const defaultConfig: AppConfig = {
  openWeatherApiKey: "",
  empresaNome: "",
  empresaCnpj: "",
  empresaEndereco: "",
  empresaTelefone: "",
  empresaEmail: "",
};

export default function Configuracoes() {
  const [config, setConfig] = useLocalStorage<AppConfig>("appConfig", defaultConfig);
  const [form, setForm] = useState<AppConfig>(config);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(form);
    toast({
      title: "Configurações salvas!",
      description: "Suas configurações foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Configure sua empresa e integrações</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card rounded-xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">
                Dados da Empresa
              </h2>
              <p className="text-sm text-muted-foreground">
                Informações que aparecerão nas notas e orçamentos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="empresaNome">Nome da Empresa</Label>
              <Input
                id="empresaNome"
                value={form.empresaNome}
                onChange={(e) => setForm({ ...form, empresaNome: e.target.value })}
                placeholder="Nome da sua empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresaCnpj">CNPJ</Label>
              <Input
                id="empresaCnpj"
                value={form.empresaCnpj}
                onChange={(e) => setForm({ ...form, empresaCnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="empresaEndereco">Endereço</Label>
              <Textarea
                id="empresaEndereco"
                value={form.empresaEndereco}
                onChange={(e) => setForm({ ...form, empresaEndereco: e.target.value })}
                placeholder="Rua, número, bairro, cidade - UF, CEP"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresaTelefone">Telefone</Label>
              <Input
                id="empresaTelefone"
                value={form.empresaTelefone}
                onChange={(e) => setForm({ ...form, empresaTelefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresaEmail">Email</Label>
              <Input
                id="empresaEmail"
                type="email"
                value={form.empresaEmail}
                onChange={(e) => setForm({ ...form, empresaEmail: e.target.value })}
                placeholder="contato@empresa.com"
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Key className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-foreground">
                Integrações
              </h2>
              <p className="text-sm text-muted-foreground">
                Configure as APIs externas
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openWeatherApiKey">Chave API OpenWeatherMap</Label>
              <Input
                id="openWeatherApiKey"
                type="password"
                value={form.openWeatherApiKey}
                onChange={(e) => setForm({ ...form, openWeatherApiKey: e.target.value })}
                placeholder="Sua chave de API do OpenWeatherMap"
              />
              <p className="text-xs text-muted-foreground">
                Obtenha sua chave gratuita em{" "}
                <a
                  href="https://openweathermap.org/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  openweathermap.org
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Configurações
          </Button>
        </div>
      </form>
    </div>
  );
}
