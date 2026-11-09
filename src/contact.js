import { business } from './data/business.js';

/** Enlace de WhatsApp con mensaje inicial. */
export function whatsappLink(message) {
  const text = message || `Hola, ${business.nombre}. Quiero recibir asesoría sobre sus piezas.`;
  return `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(text)}`;
}

/** Mensaje que menciona el producto consultado. */
export function productWhatsappLink(product, categoryName) {
  const nombre = product.nombre?.trim() || 'una pieza del catálogo';
  const cat = categoryName ? ` (${categoryName})` : '';
  return whatsappLink(
    `Hola, ${business.nombre}. Me interesa ${nombre}${cat} [ref: ${product.id}]. ¿Me cuentas precio y disponibilidad?`
  );
}

/** Mensaje para categorías aún sin productos. */
export function categoryWhatsappLink(categoryName) {
  return whatsappLink(`Hola, ${business.nombre}. ¿Qué piezas tienen disponibles en ${categoryName}?`);
}

export const instagramLink = business.instagram;
