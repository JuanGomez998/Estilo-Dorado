// Piezas de ejemplo. Se usan para:
//  1) generar el HTML de respaldo del catálogo (si Supabase no responde),
//  2) la carga inicial en supabase/schema.sql.
// Una vez conectes Supabase, los productos se administran desde /admin.
export const seedProducts = [
  { slug: 'manilla-balines-cordon-negro', name: 'Manilla balines con cordón negro', category: 'Manillas', price: 38000, stock: 12, badge: 'Más vendido', is_featured: true,
    description: 'Balines lisos y tallados sobre cordón tejido. La que más piden.', images: ['img/productos/manilla-balines-cordon.webp'] },
  { slug: 'manilla-eslabon-cubano', name: 'Manilla eslabón cubano', category: 'Manillas', price: 45000, stock: 8, badge: 'Nuevo', is_featured: false,
    description: 'Eslabón cubano con peso y brillo para todos los días.', images: ['img/placeholder.svg'] },
  { slug: 'manilla-tejido-plano', name: 'Manilla tejido plano', category: 'Manillas', price: 32000, stock: 10, badge: null, is_featured: false,
    description: 'Tejido plano que se acomoda a la muñeca sin enredarse.', images: ['img/placeholder.svg'] },
  { slug: 'manilla-rigida-lisa', name: 'Manilla rígida lisa', category: 'Manillas', price: 42000, stock: 6, badge: null, is_featured: false,
    description: 'Rígida y lisa: minimalista, va con todo.', images: ['img/placeholder.svg'] },
  { slug: 'cadena-caballero-tejido-torcido', name: 'Cadena caballero tejido torcido', category: 'Cadenas', price: 58000, stock: 9, badge: 'Más vendido', is_featured: true,
    description: 'Tejido torcido con presencia, para llevar sola o en capas.', images: ['img/productos/cadena-caballero.webp'] },
  { slug: 'cadena-cubana-gruesa', name: 'Cadena cubana gruesa', category: 'Cadenas', price: 75000, stock: 5, badge: 'Nuevo', is_featured: false,
    description: 'Cubana gruesa para quien no pasa desapercibido.', images: ['img/placeholder.svg'] },
  { slug: 'cadena-rolo-fina', name: 'Cadena rolo fina', category: 'Cadenas', price: 48000, stock: 11, badge: null, is_featured: false,
    description: 'Rolo fino y discreto, perfecto para colgar un dije.', images: ['img/placeholder.svg'] },
  { slug: 'duo-manillas-pareja-balines', name: 'Dúo manillas pareja balines', category: 'Dúos', price: 65000, stock: 7, badge: null, is_featured: true,
    description: 'Dos manillas de balines para llevar en pareja.', images: ['img/placeholder.svg'] },
  { slug: 'duo-cadena-manilla', name: 'Dúo cadena + manilla', category: 'Dúos', price: 98000, stock: 4, badge: null, is_featured: false,
    description: 'Cadena y manilla a juego, listas para regalar.', images: ['img/placeholder.svg'] },
  { slug: 'dije-cruz-lisa', name: 'Dije cruz lisa', category: 'Dijes', price: 28000, stock: 15, badge: null, is_featured: false,
    description: 'Cruz de líneas limpias para tu cadena favorita.', images: ['img/placeholder.svg'] },
  { slug: 'dije-inicial', name: 'Dije inicial (letra a elección)', category: 'Dijes', price: 30000, stock: 20, badge: null, is_featured: false,
    description: 'Tu inicial en dorado. Nos dices la letra por WhatsApp.', images: ['img/placeholder.svg'] },
  { slug: 'dije-medalla-redonda', name: 'Dije medalla redonda', category: 'Dijes', price: 26000, stock: 12, badge: null, is_featured: false,
    description: 'Medalla redonda clásica, lista para tu cadena.', images: ['img/placeholder.svg'] },
  { slug: 'anillo-sello-liso', name: 'Anillo sello liso', category: 'Anillos', price: 34000, stock: 10, badge: null, is_featured: false,
    description: 'Sello liso con carácter, sin exagerar.', images: ['img/placeholder.svg'] },
  { slug: 'anillo-trenzado', name: 'Anillo trenzado', category: 'Anillos', price: 29000, stock: 14, badge: null, is_featured: false,
    description: 'Trenzado fino que brilla desde cualquier ángulo.', images: ['img/placeholder.svg'] },
].map((p, i) => ({ id: p.slug, is_visible: true, sort_order: (i + 1) * 10, ...p }));

export const seedSettings = {
  whatsapp_number: '573024242009',
  banner_text: 'Envíos a todo Colombia · 5 años de garantía en el color',
  banner_visible: 'true',
  shipping_text: 'Enviamos a todo Colombia desde Medellín.\nLlega en 1 a 5 días hábiles.\nEl envío lo paga el comprador; te confirmamos el valor antes de despachar.',
  returns_text: 'Tienes 15 días calendario desde que recibes tu pieza.\nDebe estar sin uso, en perfecto estado y con su empaque original.\nEl envío del cambio lo cubre el comprador.',
  warranty_text: 'Cubre el color de la joya durante 5 años.\nNo cubre daños por mal uso, contacto con químicos ni arreglos hechos por terceros.\nPara reclamarla, escríbenos por WhatsApp con fotos de la pieza y la fecha de compra.',
  free_shipping_min: '0',
};

