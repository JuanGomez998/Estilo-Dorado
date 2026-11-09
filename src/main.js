// El contenido (catálogo, materiales, políticas) está en index.html.
// Este archivo solo añade interacción: filtros, menú móvil, header y animaciones.

// Filtros del catálogo: se construyen a partir de las tarjetas que hay en el HTML.
const grid = document.getElementById('product-grid');
const filters = document.getElementById('filters');
const count = document.getElementById('results-count');
const cards = [...grid.querySelectorAll('.product-card')];
const catNames = new Map();
cards.forEach((c) => {
  const id = c.dataset.categoria;
  if (id && !catNames.has(id)) catNames.set(id, c.querySelector('.card-tag')?.textContent.trim() || id);
});

const tabs = [['todas', 'Todas'], ...catNames].map(([id, nombre]) => {
  const n = id === 'todas' ? cards.length : cards.filter((c) => c.dataset.categoria === id).length;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chip';
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-controls', 'product-grid');
  btn.dataset.cat = id;
  btn.innerHTML = `<span></span><span class="chip-count">${n}</span>`;
  btn.firstChild.textContent = nombre;
  btn.addEventListener('click', () => select(id));
  filters.append(btn);
  return btn;
});

function select(id) {
  let shown = 0;
  tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.cat === id)));
  cards.forEach((c) => {
    const visible = id === 'todas' || c.dataset.categoria === id;
    c.hidden = !visible;
    if (visible) shown++;
  });
  count.textContent = `${shown} ${shown === 1 ? 'pieza' : 'piezas'}`;
  grid.classList.remove('fade-in'); void grid.offsetWidth; grid.classList.add('fade-in');
}
select('todas');

document.getElementById('year').textContent = new Date().getFullYear();

// Menú móvil
const toggle = document.getElementById('nav-toggle');
const nav = document.getElementById('main-nav');
const setMenu = (open) => {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  document.body.classList.toggle('menu-open', open);
};
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

// Header al hacer scroll
const header = document.getElementById('site-header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Aparición suave
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
    }), { threshold: 0.12 })
  : null;
document.querySelectorAll('.reveal').forEach((n) => (io ? io.observe(n) : n.classList.add('is-visible')));
