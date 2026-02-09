export interface Colaborador {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  funcao: string;
  dataCadastro: Date;
  ativo: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  cpfCnpj: string;
  anotacoes: string;
  dataCadastro: Date;
}

export type StatusServico = "agendado" | "em_andamento" | "concluido" | "cancelado";

export type TipoDocumento = "geral" | "antes" | "depois";

export interface Documento {
  id: string;
  nome: string;
  tipo: string;
  dataUrl: string;
  dataUpload: Date;
  categoria?: TipoDocumento;
  descricao?: string;
}

export interface RelatorioAndamento {
  id: string;
  servicoId: string;
  descricao: string;
  fotosAntes: Documento[];
  fotosDepois: Documento[];
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export interface Servico {
  id: string;
  titulo: string;
  descricao: string;
  clienteId: string;
  colaboradorId: string;
  data: string;
  horario: string;
  valor: number;
  status: StatusServico;
  tipoServico: string;
  dataCadastro: Date;
  documentos?: Documento[];
  fotosAntes?: Documento[];
  fotosDepois?: Documento[];
  latitude?: number;
  longitude?: number;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  apartamento?: string;
}

// Orçamentos
export type StatusOrcamento = "pendente" | "aprovado" | "recusado";
export type TipoOrcamento = "detalhado" | "simplificado";
export type TipoItem = "material" | "mao_de_obra";

export interface ItemOrcamento {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  tipo: TipoItem;
}

export interface Orcamento {
  id: string;
  numero: string;
  clienteId: string;
  tipoOrcamento: TipoOrcamento;
  titulo: string;
  descricao: string;
  itens: ItemOrcamento[];
  valorTotal: number;
  validade: string;
  status: StatusOrcamento;
  dataCadastro: Date;
}

// Nota Fiscal
export type TipoNota = "fiscal" | "nao_fiscal";

export interface NotaFiscal {
  id: string;
  numero: string;
  servicoId: string;
  clienteId: string;
  tipo: TipoNota;
  valor: number;
  descricao: string;
  dataEmissao: Date;
}

// Configurações
export interface AppConfig {
  openWeatherApiKey: string;
  empresaNome: string;
  empresaCnpj: string;
  empresaEndereco: string;
  empresaTelefone: string;
  empresaEmail: string;
}

// Weather
export interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  city: string;
}

export interface WeatherForecast {
  date: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
}
