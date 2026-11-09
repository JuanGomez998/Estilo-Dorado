import { products } from './data/products.js';
import { categories } from './data/categories.js';
import { productWhatsappLink, categoryWhatsappLink } from './contact.js';

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const catName = (id) => categories.find((c) => c.id === id)?.nombre || '';

const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') node.textContent = v;
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v);
  }
  [].concat(children).forEach((c) => c && node.append(c));
  return node;
};

function productCard(p) {
  const nombre = p.nombre?.trim() || 'Pieza por nombrar';
  const hasPrice = typeof p.precio === 'number' && p.precio > 0;

  const media = el('div', { class: 'card-media' });
  if (p.imagen) {
    const img = el('img', { src: import.meta.env.BASE_URL + p.imagen.replace(/^\//, ''), alt: p.alt || nombre, loading: 'lazy', width: 960, height: 1200 });
    img.addEventListener('error', () => media.classList.add('is-missing'), { once: true });
    media.append(img);
  } else {
    media.classList.add('is-missing');
  }
  media.append(el('span', { class: 'card-missing', text: 'Foto próximamente' }));
  media.append(el('span', { class: 'card-tag', text: catName(p.categoria) }));

  const body = el('div', { class: 'card-body' }, [
    el('h3', { class: 'card-title', text: nombre }),
    el('p', { class: 'card-price' + (hasPrice ? '' : ' is-ask'), text: hasPrice ? cop.format(p.precio) : 'Consultar precio' }),
    p.descripcion?.trim() ? el('p', { class: 'card-desc', text: p.descripcion }) : null,
    el('a', {
      class: 'btn btn-gold btn-block',
      href: productWhatsappLink(p, catName(p.categoria)),
      target: '_blank',
      rel: 'noopener',
      'aria-label': `Consultar por WhatsApp: ${nombre}`,
    }, ['Consultar por WhatsApp']),
  ]);

  return el('article', { class: 'product-card' }, [media, body]);
}

function emptyState(categoryId) {
  const name = catName(categoryId);
  return el('div', { class: 'empty-state' }, [
    el('p', { class: 'empty-title', text: name ? `Pronto tendremos ${name.toLowerCase()} en el catálogo` : 'Aún no hay piezas publicadas' }),
    el('p', { text: 'Escríbenos y te contamos qué tenemos disponible.' }),
    el('a', { class: 'btn btn-ghost', href: categoryWhatsappLink(name || 'el catálogo'), target: '_blank', rel: 'noopener' }, [
      `Preguntar por ${name ? name.toLowerCase() : 'piezas'}`,
    ]),
  ]);
}

export function initCatalog() {
  const filters = document.getElementById('filters');
  const grid = document.getElementById('product-grid');
  const count = document.getElementById('results-count');
  const valid = products.filter((p) => p && p.id);
  let active = 'todas';

  const tabs = [{ id: 'todas', nombre: 'Todas' }, ...categories].map((c) => {
    const n = c.id === 'todas' ? valid.length : valid.filter((p) => p.categoria === c.id).length;
    const btn = el('button', {
      type: 'button', role: 'tab', class: 'chip', id: `cat-${c.id}`,
      'aria-selected': c.id === active ? 'true' : 'false', 'aria-controls': 'product-grid',
    }, [c.nombre, el('span', { class: 'chip-count', text: String(n) })]);
    btn.addEventListener('click', () => select(c.id));
    filters.append(btn);
    return btn;
  });

  function select(id) {
    active = id;
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.id === `cat-${id}`)));
    const list = id === 'todas' ? valid : valid.filter((p) => p.categoria === id);
    grid.replaceChildren(...(list.length ? list.map(productCard) : [emptyState(id === 'todas' ? null : id)]));
    count.textContent = list.length ? `${list.length} ${list.length === 1 ? 'pieza' : 'piezas'}` : '';
    grid.classList.remove('fade-in'); void grid.offsetWidth; grid.classList.add('fade-in');
  }

  select(active);
}
