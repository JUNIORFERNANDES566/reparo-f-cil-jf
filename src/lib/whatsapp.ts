export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Add Brazil country code if not present
  if (cleaned.length === 11) {
    return `55${cleaned}`;
  } else if (cleaned.length === 10) {
    return `55${cleaned}`;
  }
  
  return cleaned;
}

export function openWhatsApp(phone: string, message?: string): void {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = message ? encodeURIComponent(message) : "";
  const url = message 
    ? `https://wa.me/${formattedPhone}?text=${encodedMessage}`
    : `https://wa.me/${formattedPhone}`;
  
  window.open(url, "_blank");
}
