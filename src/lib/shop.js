// Funciones puras (sin DOM) compartidas por la tienda, el panel y el build.
export const SITE_URL = 'https://juangomez998.github.io/Estilo-Dorado/';
export const DEFAULT_WA = '573024242009';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** 38000 → "$38.000" */
export const cop = (n) => '$' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Resuelve rutas relativas (img/...) contra la base del sitio. */
export const imgUrl = (url, base = '/') => (!url ? `${base}img/placeholder.svg` : /^(https?:|data:|blob:)/.test(url) ? url : base + url.replace(/^\//, ''));

export const isSoldOut = (p) => !(Number(p.stock) > 0);
export const tagsOf = (p) => [p.badge, isSoldOut(p) ? 'Agotado' : null].filter(Boolean);

export const slugify = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const waLink = (text, number = DEFAULT_WA) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
export const GENERAL_MSG = 'Hola, quiero asesoría para elegir una pieza de Estilo Dorado';
export const productMsg = (p) => `Hola, me interesa: ${p.name} (${cop(p.price)})`;

export function cardHTML(p, base = '/', number = DEFAULT_WA) {
  const sold = isSoldOut(p);
  const badge = sold ? 'Agotado' : p.badge;
  const badgeCls = sold ? 'is-sold' : p.badge === 'Nuevo' ? 'is-new' : 'is-best';
  return `<article class="product-card${sold ? ' sold-out' : ''}" data-slug="${esc(p.slug)}" data-categoria="${esc(p.category)}">
  <a class="card-media" href="#p/${esc(p.slug)}" aria-label="Ver detalles: ${esc(p.name)}">
    <img src="${esc(imgUrl(p.images?.[0], base))}" alt="${esc(p.name)}" loading="lazy" decoding="async" width="960" height="1200" />
    <span class="card-tag">${esc(p.category)}</span>
    ${badge ? `<span class="card-badge ${badgeCls}">${esc(badge)}</span>` : ''}
  </a>
  <div class="card-body">
    <h3 class="card-title"><a href="#p/${esc(p.slug)}">${esc(p.name)}</a></h3>
    <p class="card-desc">${esc(p.description)}</p>
    <p class="card-price">${cop(p.price)}</p>
    <div class="card-actions">
      ${sold
        ? `<a class="btn btn-ghost btn-block" href="${esc(waLink(`Hola, ¿cuándo vuelve a estar disponible ${p.name}?`, number))}" target="_blank" rel="noopener noreferrer" data-wa-product="${esc(p.id)}">Avísame cuando llegue</a>`
        : `<button type="button" class="btn btn-gold btn-block" data-add="${esc(p.slug)}">Agregar al carrito</button>
      <a class="btn btn-ghost btn-block btn-wa-sm" href="${esc(waLink(productMsg(p), number))}" target="_blank" rel="noopener noreferrer" data-wa-product="${esc(p.id)}" aria-label="Pedir por WhatsApp: ${esc(p.name)}">Pedir por WhatsApp</a>`}
    </div>
  </div>
</article>`;
}

/** Datos estructurados schema.org (Product) para cada pieza. */
export function jsonLd(products, base = '/') {
  const abs = (u) => new URL(imgUrl(u, base).replace(base, ''), SITE_URL).href;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': products.map((p) => ({
      '@type': 'Product',
      name: p.name,
      sku: p.slug,
      description: p.description,
      category: p.category,
      image: (p.images?.length ? p.images : [null]).map((u) => (/^https?:/.test(u || '') ? u : abs(u))),
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

