import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CartItem } from '@/types/database.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export interface WhatsAppOrderData {
  items: CartItem[];
  totalPrice: number;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  customerNotes?: string;
}

/**
 * Genera il link wa.me formattato con tutti i dettagli dell'ordine
 */
export function buildWhatsAppCheckoutUrl(data: WhatsAppOrderData): string {
  const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '393400000000';
  
  const dateStr = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let message = `🛒 *NUOVO ORDINE E-COMMERCE*\n`;
  if (data.orderNumber) {
    message += `📦 *Codice Ordine: #${data.orderNumber}*\n`;
  }
  message += `📅 Data: ${dateStr}\n\n`;
  message += `*DETTAGLI ARTICOLI:*\n`;

  data.items.forEach((item, index) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    message += `${index + 1}. *${item.name}*\n`;
    message += `   Quantità: ${item.quantity} x €${item.price.toFixed(2)} = €${itemTotal}\n`;
  });

  message += `\n💰 *TOTALE ORDINE: €${data.totalPrice.toFixed(2)}*\n\n`;

  message += `*DATI CLIENTE:*\n`;
  if (data.customerName) message += `👤 Nome: ${data.customerName}\n`;
  if (data.customerEmail) message += `✉️ Email: ${data.customerEmail}\n`;
  if (data.customerPhone) message += `📞 Telefono: ${data.customerPhone}\n`;
  if (data.shippingAddress) message += `📍 Indirizzo spedizione: ${data.shippingAddress}\n`;
  if (data.customerNotes) message += `📝 Note ordine: ${data.customerNotes}\n`;

  message += `\n_Resto in attesa di conferma disponibilità e dettagli per la spedizione._`;

  return `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
}

