// Lógica de tienda: formateo, catálogo, carrito en localStorage y mensajes de WhatsApp.
export const SITE_URL = 'https://juangomez998.github.io/Estilo-Dorado/';
export const DEFAULT_WA = '573024242009';
export const CART_STORAGE_KEY = 'ed_cart_v1';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** 38000 → "$38.000" */
export const cop = (n) => '$' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Resuelve rutas relativas contra la base del sitio. */
export const imgUrl = (url, base = '/') => {
  if (!url) return `${base}img/placeholder.svg`;
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return base + url.replace(/^\//, '');
};

export const isSoldOut = (p) => !(Number(p.stock) > 0);

export const slugify = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const waLink = (text, number = DEFAULT_WA) => {
  const cleanNumber = String(number || DEFAULT_WA).replace(/\D/g, '');
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
};

export const GENERAL_MSG = 'Hola, quiero asesoría para elegir una pieza de Estilo Dorado';
export const productMsg = (p) => `Hola, me interesa la pieza "${p.name}" (${cop(p.price)}). ¿Tienen disponibilidad inmediata?`;

/** Renderiza la tarjeta de producto para la grilla. */
export function cardHTML(p, base = '/', number = DEFAULT_WA) {
  const sold = isSoldOut(p);
  const badge = sold ? 'Agotado' : p.badge;
  const badgeCls = sold ? 'is-sold' : p.badge === 'Nuevo' ? 'is-new' : 'is-best';
  const firstImg = p.images?.[0] || 'img/placeholder.svg';

  return `<article class="product-card${sold ? ' sold-out' : ''}" data-slug="${esc(p.slug)}" data-categoria="${esc(p.category)}" data-price="${p.price}" data-featured="${p.is_featured ? '1' : '0'}" data-badge="${esc(p.badge || '')}" data-stock="${p.stock}">
  <a class="card-media" href="#p/${esc(p.slug)}" aria-label="Ver detalles: ${esc(p.name)}">
    <img src="${esc(imgUrl(firstImg, base))}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="960" height="1200" />
    <span class="card-tag">${esc(p.category)}</span>
    ${badge ? `<span class="card-badge ${badgeCls}">${esc(badge)}</span>` : ''}
  </a>
  <div class="card-body">
    <h3 class="card-title"><a href="#p/${esc(p.slug)}">${esc(p.name)}</a></h3>
    <p class="card-desc">${esc(p.description || '')}</p>
    <p class="card-price">${cop(p.price)}</p>
    <div class="card-actions">
      ${sold
        ? `<a class="btn btn-ghost btn-block btn-sold" href="${esc(waLink(`Hola, ¿cuándo vuelve a estar disponible ${p.name}?`, number))}" target="_blank" rel="noopener noreferrer" data-wa-product="${esc(p.id || p.slug)}">Agotado · Consultar</a>`
        : `<button type="button" class="btn btn-gold btn-block btn-add-cart" data-add="${esc(p.slug)}">Agregar al carrito</button>
           <a class="btn btn-ghost btn-block btn-wa-sm" href="${esc(waLink(productMsg(p), number))}" target="_blank" rel="noopener noreferrer" data-wa-product="${esc(p.id || p.slug)}" aria-label="Pedir por WhatsApp: ${esc(p.name)}">Pedir por WhatsApp</a>`}
    </div>
  </div>
</article>`;
}

/** Genera JSON-LD Schema.org tipo Product */
export function jsonLd(products, base = '/') {
  const abs = (u) => {
    if (!u) return `${SITE_URL}img/placeholder.svg`;
    if (/^https?:/.test(u)) return u;
    return new URL(imgUrl(u, base).replace(base, ''), SITE_URL).href;
  };
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': products.map((p) => ({
      '@type': 'Product',
      name: p.name,
      sku: p.slug,
      description: p.description,
      category: p.category,
      image: (p.images && p.images.length ? p.images : ['img/placeholder.svg']).map(abs),
      brand: { '@type': 'Brand', name: 'Estilo Dorado' },
      url: `${SITE_URL}#p/${p.slug}`,
      offers: {
        '@type': 'Offer',
        price: p.price,
        priceCurrency: 'COP',
        availability: isSoldOut(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        url: `${SITE_URL}#p/${p.slug}`,
      },
    })),
  }).replace(/</g, '\\u003c');
}

// ─────────────────────────────────────────────────────────────
//  CARRITO EN LOCALSTORAGE
// ─────────────────────────────────────────────────────────────
export function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error leyendo carrito:', err);
    return [];
  }
}

export function saveCart(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('ed:cart-updated', { detail: { items } }));
  } catch (err) {
    console.error('Error guardando carrito:', err);
  }
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.slug === product.slug);
  const maxStock = Number(product.stock) > 0 ? Number(product.stock) : 999;

  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, maxStock);
  } else {
    cart.push({
      id: product.id || product.slug,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || 'img/placeholder.svg',
      quantity: Math.min(quantity, maxStock),
      stock: maxStock,
    });
  }
  saveCart(cart);
  return cart;
}

export function updateCartQuantity(slug, newQuantity) {
  const cart = getCart();
  const item = cart.find((i) => i.slug === slug);
  if (!item) return cart;
  if (newQuantity <= 0) {
    return removeFromCart(slug);
  }
  item.quantity = Math.min(newQuantity, item.stock || 999);
  saveCart(cart);
  return cart;
}

export function removeFromCart(slug) {
  const cart = getCart().filter((i) => i.slug !== slug);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
}

/** Arma el mensaje formal de pedido para WhatsApp */
export function buildOrderMessage(cart, city = '') {
  if (!cart || cart.length === 0) return GENERAL_MSG;
  const itemsText = cart
    .map((item) => `• ${item.quantity}x ${item.name} (${cop(item.price * item.quantity)})`)
    .join('\n');
  const total = getCartTotal();
  const cityText = city.trim() ? `\nCiudad de entrega: ${city.trim()}` : '\nCiudad de entrega: (a coordinar)';

  return `Hola Estilo Dorado, quiero realizar el siguiente pedido:\n\n${itemsText}\n\nTotal: ${cop(total)} COP${cityText}\n\n¿Me confirman disponibilidad y coordinamos el despacho? Gracias.`;
}
