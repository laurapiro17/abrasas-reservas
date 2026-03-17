
export function formatWhatsAppLink(phone: string, message: string): string {
  // Remove any non-numeric characters
  let cleanPhone = phone.replace(/\D/g, '');
  
  // If no country code, assume Spain (+34)
  if (cleanPhone.length === 9) {
    cleanPhone = '34' + cleanPhone;
  }
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export function getConfirmationMessage(name: string, date: string, time: string): string {
  return `Hola ${name}, tu reserva en ABRASAS para el día ${date} a las ${time} ha sido CONFIRMADA. ¡Te esperamos! 🔥🥩`;
}

export function getReminderMessage(name: string, date: string, time: string): string {
  return `Hola ${name}, te recordamos tu reserva en ABRASAS para MAÑANA (${date}) a las ${time}. Si no puedes venir, por favor avísanos respondiendo a este mensaje. ¡Gracias! 😊`;
}

export function getRejectionMessage(name: string, date: string, time: string): string {
  return `Hola ${name}, lo sentimos, pero no podemos confirmar tu reserva en ABRASAS para el día ${date} a las ${time}. Disculpa las molestias. 🙏`;
}
