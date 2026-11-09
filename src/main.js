import { initCatalog } from './render.js';
import { business, materiales, politicas } from './data/business.js';
import { whatsappLink, instagramLink } from './contact.js';

const fillList = (id, items) => {
  const ul = document.getElementById(id);
  if (!ul) return;
  ul.replaceChildren(...(items?.length ? items : ['Información próximamente.']).map((t) => {
    const li = document.createElement('li'); li.textContent = t; return li;
  }));
};

// Catálogo
initCatalog();

// Contacto
document.querySelectorAll('[data-wa]').forEach((a) => (a.href = whatsappLink()));
document.getElementById('contact-ig').href = instagramLink;
document.getElementById('contact-meta').textContent =
  `${business.whatsappVisible} · ${business.instagramUsuario} · ${business.ubicacion}`;

// Materiales
document.getElementById('materials-intro').textContent = materiales.intro;
fillList('care-list', materiales.cuidados);
const layers = document.getElementById('layers');
materiales.capas.forEach((c, i) => {
  const d = document.createElement('div');
  d.className = 'layer';
  d.style.setProperty('--i', i);
  d.innerHTML = `<span class="layer-label"></span><span class="layer-text"></span>`;
  d.querySelector('.layer-label').textContent = c.titulo;
  d.querySelector('.layer-text').textContent = c.texto || '';
  layers.append(d);
});

// Políticas
fillList('policy-envios', politicas.envios);
fillList('policy-cambios', politicas.cambios);
fillList('policy-garantia', politicas.garantia);
document.getElementById('policy-nota').textContent = politicas.notaLegal;

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
