/**
 * Formata um número de telefone e retorna o link do WhatsApp
 */
export const formatWhatsAppLink = (telefone: string): string => {
  // Remove todos os caracteres não numéricos
  const cleanNumber = telefone.replace(/\D/g, "");
  
  // Se o número já começar com 55, não adiciona novamente
  const fullNumber = cleanNumber.startsWith("55") ? cleanNumber : `55${cleanNumber}`;
  
  return `https://wa.me/${fullNumber}`;
};

/**
 * Abre o WhatsApp com uma mensagem pré-definida
 */
export const openWhatsApp = (telefone: string, message?: string): void => {
  let url = formatWhatsAppLink(telefone);
  
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  
  window.open(url, "_blank");
};
