import jsPDF from "jspdf";
import { Cliente, Servico, Orcamento, AppConfig, ItemOrcamento } from "@/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (date: Date | string) =>
  new Intl.DateTimeFormat("pt-BR").format(new Date(date));

export function generateNotaFiscalPDF(
  servico: Servico,
  cliente: Cliente,
  config: AppConfig,
  tipo: "fiscal" | "nao_fiscal"
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(config.empresaNome || "ReparoPro", pageWidth / 2, 25, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (config.empresaCnpj) {
    doc.text(`CNPJ: ${config.empresaCnpj}`, pageWidth / 2, 32, { align: "center" });
  }
  if (config.empresaEndereco) {
    doc.text(config.empresaEndereco, pageWidth / 2, 38, { align: "center" });
  }
  if (config.empresaTelefone || config.empresaEmail) {
    doc.text(
      `${config.empresaTelefone || ""} ${config.empresaEmail ? `| ${config.empresaEmail}` : ""}`,
      pageWidth / 2,
      44,
      { align: "center" }
    );
  }

  // Title
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 52, pageWidth, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(
    tipo === "fiscal" ? "NOTA FISCAL DE SERVIÇO" : "RECIBO DE SERVIÇO",
    pageWidth / 2,
    60,
    { align: "center" }
  );
  doc.setTextColor(0, 0, 0);

  // Nota info
  let y = 75;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE", 20, y);
  
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${cliente.nome}`, 20, y);
  y += 6;
  doc.text(`CPF/CNPJ: ${cliente.cpfCnpj || "Não informado"}`, 20, y);
  y += 6;
  doc.text(`Endereço: ${cliente.endereco}, ${cliente.cidade}`, 20, y);
  y += 6;
  doc.text(`Telefone: ${cliente.telefone}`, 20, y);
  y += 6;
  doc.text(`Email: ${cliente.email}`, 20, y);

  y += 15;
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO SERVIÇO", 20, y);
  
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Serviço: ${servico.titulo}`, 20, y);
  y += 6;
  doc.text(`Tipo: ${servico.tipoServico}`, 20, y);
  y += 6;
  doc.text(`Data: ${formatDate(servico.data)}`, 20, y);
  y += 6;
  
  // Description with word wrap
  const descLines = doc.splitTextToSize(`Descrição: ${servico.descricao}`, pageWidth - 40);
  doc.text(descLines, 20, y);
  y += descLines.length * 5 + 5;

  // Value box
  y += 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 5, pageWidth - 40, 20, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("VALOR TOTAL:", 30, y + 7);
  doc.setTextColor(59, 130, 246);
  doc.text(formatCurrency(servico.valor), pageWidth - 30, y + 7, { align: "right" });
  doc.setTextColor(0, 0, 0);

  // Footer
  y += 40;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Emitido em: ${formatDate(new Date())}`, pageWidth / 2, y, { align: "center" });
  
  y += 30;
  doc.line(50, y, pageWidth - 50, y);
  y += 5;
  doc.text("Assinatura do Cliente", pageWidth / 2, y, { align: "center" });

  return doc;
}

export function generateOrcamentoPDF(
  orcamento: Orcamento,
  cliente: Cliente,
  config: AppConfig
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(config.empresaNome || "ReparoPro", pageWidth / 2, 25, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (config.empresaCnpj) {
    doc.text(`CNPJ: ${config.empresaCnpj}`, pageWidth / 2, 32, { align: "center" });
  }
  if (config.empresaEndereco) {
    doc.text(config.empresaEndereco, pageWidth / 2, 38, { align: "center" });
  }
  if (config.empresaTelefone || config.empresaEmail) {
    doc.text(
      `${config.empresaTelefone || ""} ${config.empresaEmail ? `| ${config.empresaEmail}` : ""}`,
      pageWidth / 2,
      44,
      { align: "center" }
    );
  }

  // Title
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 52, pageWidth, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`ORÇAMENTO Nº ${orcamento.numero}`, pageWidth / 2, 60, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Orcamento info
  let y = 75;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE", 20, y);
  
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${cliente.nome}`, 20, y);
  y += 6;
  doc.text(`CPF/CNPJ: ${cliente.cpfCnpj || "Não informado"}`, 20, y);
  y += 6;
  doc.text(`Endereço: ${cliente.endereco}, ${cliente.cidade}`, 20, y);
  y += 6;
  doc.text(`Telefone: ${cliente.telefone}`, 20, y);

  y += 15;
  doc.setFont("helvetica", "bold");
  doc.text("DETALHES DO ORÇAMENTO", 20, y);
  
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Título: ${orcamento.titulo}`, 20, y);
  y += 6;
  doc.text(`Validade: ${formatDate(orcamento.validade)}`, 20, y);
  y += 6;
  
  const descLines = doc.splitTextToSize(`Descrição: ${orcamento.descricao}`, pageWidth - 40);
  doc.text(descLines, 20, y);
  y += descLines.length * 5 + 10;

  // Items table (if detailed)
  if (orcamento.tipoOrcamento === "detalhado" && orcamento.itens.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("ITENS", 20, y);
    y += 8;

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 5, pageWidth - 40, 8, "F");
    doc.setFontSize(9);
    doc.text("Descrição", 22, y);
    doc.text("Qtd", 100, y);
    doc.text("Valor Unit.", 120, y);
    doc.text("Total", 160, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    orcamento.itens.forEach((item: ItemOrcamento) => {
      const itemTotal = item.quantidade * item.valorUnitario;
      doc.text(item.descricao.substring(0, 35), 22, y);
      doc.text(`${item.quantidade} ${item.unidade}`, 100, y);
      doc.text(formatCurrency(item.valorUnitario), 120, y);
      doc.text(formatCurrency(itemTotal), 160, y);
      y += 6;
    });
  }

  // Value box
  y += 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 5, pageWidth - 40, 20, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("VALOR TOTAL:", 30, y + 7);
  doc.setTextColor(234, 88, 12);
  doc.text(formatCurrency(orcamento.valorTotal), pageWidth - 30, y + 7, { align: "right" });
  doc.setTextColor(0, 0, 0);

  // Footer
  y += 35;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Emitido em: ${formatDate(new Date())}`, pageWidth / 2, y, { align: "center" });
  
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Este orçamento é válido pelo prazo indicado acima.", pageWidth / 2, y, { align: "center" });

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output("blob");
}
