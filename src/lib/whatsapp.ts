export function generateWhatsAppLink(phone: string, text: string): string {
  // Remove non-numeric characters from phone
  // Assuming Egyptian numbers by default if no country code, prepend 2
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('01')) {
    cleanPhone = '2' + cleanPhone;
  }
  
  // Format the text for URL
  const encodedText = encodeURIComponent(text);
  
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
