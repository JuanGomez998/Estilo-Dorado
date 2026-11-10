// Tienda Estilo Dorado: catálogo dinámico, filtros, modal de producto, carrito y Supabase
import { seedProducts } from './data/seed.js';
import {
  cop,
  imgUrl,
  isSoldOut,
  waLink,
  cardHTML,
  GENERAL_MSG,
  productMsg,
  buildOrderMessage,
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  getCartCount,
  getCartTotal,
  DEFAULT_WA,
} from './lib/shop.js';
import {
  fetchLiveProducts,
  fetchSettings,
  fetchLiveReviews,
  trackEvent,
} from './lib/supabase.js';

// Base URL de Vite (ej. '/Estilo-Dorado/' en producción)
const BASE = import.meta.env.BASE_URL || '/';

// Estado global de la tienda
let allProducts = [...seedProducts];
let activeCategory = 'todas';
let activeTag = 'todas';
let activeSort = 'default';
let currentWhatsApp = DEFAULT_WA;
let freeShippingMin = 0;

// Referencias al DOM
const gridEl = document.getElementById('product-grid');
const countEl = document.getElementById('results-count');
const categoryFiltersEl = document.getElementById('category-filters');
const tagFiltersEl = document.getElementById('tag-filters');
const sortSelectEl = document.getElementById('catalog-sort-select');

// Modal de producto
const modalBackdrop = document.getElementById('product-modal-backdrop');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalContent = document.getElementById('modal-product-content');

// Carrito
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const cartDrawer = document.getElementById('cart-drawer');
const cartBackdrop = document.getElementById('cart-backdrop');
const cartCloseBtn = document.getElementById('cart-close-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartBadge = document.getElementById('cart-badge');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartCityInput = document.getElementById('cart-city-input');
const cartCheckoutBtn = document.getElementById('cart-checkout-btn');
const cartShippingNotice = document.getElementById('cart-shipping-notice');
const shippingNoticeText = document.getElementById('shipping-notice-text');
const shippingBarFill = document.getElementById('shipping-bar-fill');

// Banner promo
const promoBanner = document.getElementById('promo-banner');
const promoText = document.getElementById('promo-text');

// ─────────────────────────────────────────────────────────────
//  INICIALIZACIÓN
// ─────────────────────────────────────────────────────────────
async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();

  // 1. Configurar menús y navegación básica
  setupNavigation();

  // 2. Renderizar filtros con las piezas actuales
  setupCategoryFilters();
  setupTagFilters();
  setupSort();

  // 3. Inicializar carrito
  setupCart();

  // 4. Inicializar modal
  setupModal();

  // 5. Cargar ajustes desde Supabase (si está configurado)
  loadLiveSettings();

  // 6. Cargar productos desde Supabase
  loadLiveProducts();

  // 7. Cargar reseñas desde Supabase
  loadLiveReviews();

  // 8. Atender hash inicial si alguien entra con enlace directo (#p/slug)
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
}

// ─────────────────────────────────────────────────────────────
//  CARGA DE DATOS EN VIVO
// ─────────────────────────────────────────────────────────────
async function loadLiveProducts() {
  const live = await fetchLiveProducts();
  if (live && live.length > 0) {
    allProducts = live;
    renderCatalog();
    setupCategoryFilters();
  }
}

async function loadLiveSettings() {
  const settings = await fetchSettings();
  if (!settings) return;

  // WhatsApp
  if (settings.whatsapp_number) {
    currentWhatsApp = settings.whatsapp_number.replace(/\D/g, '');
    updateWhatsAppLinks();
  }

  // Barra de promoción
  if (settings.banner_visible === 'true' && settings.banner_text) {
    promoText.textContent = settings.banner_text;
    promoBanner.hidden = false;
    document.body.classList.add('has-promo');
  } else {
    promoBanner.hidden = true;
    document.body.classList.remove('has-promo');
  }

  // Envío gratis
  if (settings.free_shipping_min) {
    freeShippingMin = Number(settings.free_shipping_min) || 0;
    renderCart();
  }

  // Políticas (Envíos, Cambios, Garantía)
  if (settings.shipping_text) {
    fillList('policy-shipping-list', settings.shipping_text);
  }
  if (settings.returns_text) {
    fillList('policy-returns-list', settings.returns_text);
  }
  if (settings.warranty_text) {
    fillList('policy-warranty-list', settings.warranty_text);
  }
}

async function loadLiveReviews() {
  const reviews = await fetchLiveReviews();
  if (!reviews || reviews.length === 0) return;

  const container = document.getElementById('reviews-grid');
  if (!container) return;

  container.innerHTML = reviews
    .map(
      (r) => `<figure class="review-card reveal is-visible">
    <div class="review-stars">${'★'.repeat(r.rating || 5)}</div>
    <blockquote>“${escapeHtml(r.text)}”</blockquote>
    <figcaption><strong>${escapeHtml(r.author)}</strong>${r.city ? ` · ${escapeHtml(r.city)}` : ''}</figcaption>
  </figure>`
    )
    .join('');
}

function fillList(elementId, multilineText) {
  const el = document.getElementById(elementId);
  if (!el || !multilineText) return;
  const lines = multilineText.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    el.innerHTML = lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('');
  }
}

function updateWhatsAppLinks() {
  const generalUrl = waLink(GENERAL_MSG, currentWhatsApp);
  const waIds = ['nav-wa-btn', 'hero-wa-btn', 'contact-wa-btn', 'wa-float-btn'];
  waIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = generalUrl;
  });

  const metaEl = document.getElementById('contact-meta');
  if (metaEl) {
    const formattedNum = `+${currentWhatsApp.slice(0, 2)} ${currentWhatsApp.slice(2, 5)} ${currentWhatsApp.slice(5, 8)} ${currentWhatsApp.slice(8)}`;
    metaEl.textContent = `${formattedNum} · @estil_odorado · Medellín, Colombia`;
  }
}

// ─────────────────────────────────────────────────────────────
//  FILTROS Y CATÁLOGO
// ─────────────────────────────────────────────────────────────
function setupCategoryFilters() {
  const categories = ['todas', ...new Set(allProducts.map((p) => p.category).filter(Boolean))];

  categoryFiltersEl.innerHTML = categories
    .map((cat) => {
      const count = cat === 'todas' ? allProducts.length : allProducts.filter((p) => p.category === cat).length;
      const label = cat === 'todas' ? 'Todas' : cat;
      const isSel = cat === activeCategory;
      return `<button type="button" role="tab" class="chip${isSel ? ' active' : ''}" data-cat="${escapeHtml(cat)}" aria-selected="${isSel}">
      ${escapeHtml(label)} <span class="chip-count">${count}</span>
    </button>`;
    })
    .join('');

  categoryFiltersEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      categoryFiltersEl.querySelectorAll('button').forEach((b) => {
        const sel = b.dataset.cat === activeCategory;
        b.classList.toggle('active', sel);
        b.setAttribute('aria-selected', String(sel));
      });
      renderCatalog();
    });
  });
}

function setupTagFilters() {
  tagFiltersEl.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTag = btn.dataset.tag;
      tagFiltersEl.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.tag === activeTag));
      renderCatalog();
    });
  });
}

function setupSort() {
  sortSelectEl.addEventListener('change', (e) => {
    activeSort = e.target.value;
    renderCatalog();
  });
}

function renderCatalog() {
  // Filtrar
  let list = allProducts.filter((p) => {
    const matchCat = activeCategory === 'todas' || p.category === activeCategory;
    let matchTag = true;
    if (activeTag === 'Nuevo') matchTag = p.badge === 'Nuevo';
    else if (activeTag === 'Más vendido') matchTag = p.badge === 'Más vendido';
    else if (activeTag === 'Agotado') matchTag = isSoldOut(p);
    return matchCat && matchTag;
  });

  // Ordenar
  if (activeSort === 'price-asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (activeSort === 'price-desc') {
    list.sort((a, b) => b.price - a.price);
  } else if (activeSort === 'name-asc') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // default: destacados primero, luego sort_order
    list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (a.sort_order || 0) - (b.sort_order || 0));
  }

  // Renderizar grilla
  if (list.length === 0) {
    gridEl.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 3rem 1rem;">
      <p class="lead">No encontramos piezas con este filtro.</p>
      <button type="button" class="btn btn-ghost" id="clear-filters-btn">Ver todas las piezas</button>
    </div>`;
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        activeCategory = 'todas';
        activeTag = 'todas';
        setupCategoryFilters();
        tagFiltersEl.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.tag === 'todas'));
        renderCatalog();
      });
    }
  } else {
    gridEl.innerHTML = list.map((p) => cardHTML(p, BASE, currentWhatsApp)).join('');
  }

  // Conteo
  countEl.textContent = `${list.length} ${list.length === 1 ? 'pieza disponible' : 'piezas disponibles'}`;

  // Vincular eventos a los botones de la grilla
  bindCardEvents();
}

function bindCardEvents() {
  gridEl.querySelectorAll('.btn-add-cart').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const slug = btn.dataset.add;
      const product = allProducts.find((p) => p.slug === slug);
      if (product) {
        addToCart(product, 1);
        trackEvent('add_to_cart', product.id);
        sendGA4('add_to_cart', { item_name: product.name, price: product.price });
        openCart();
      }
    });
  });

  gridEl.querySelectorAll('[data-wa-product]').forEach((link) => {
    link.addEventListener('click', () => {
      const pid = link.dataset.waProduct;
      trackEvent('whatsapp_click', pid);
      sendGA4('generate_lead', { method: 'WhatsApp Producto', product_id: pid });
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  MODAL DE PRODUCTO (FICHA TÉCNICA)
// ─────────────────────────────────────────────────────────────
function setupModal() {
  modalCloseBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('is-open')) {
      closeModal();
    }
  });
}

function openProductModal(product) {
  if (!product) return;

  const sold = isSoldOut(product);
  const images = (product.images && product.images.length > 0) ? product.images : ['img/placeholder.svg'];
  let currentImgIndex = 0;
  let selectedQty = 1;

  // Registrar vista de producto
  trackEvent('product_view', product.id);
  sendGA4('view_item', { item_name: product.name, price: product.price, item_category: product.category });

  modalContent.innerHTML = `
    <div class="modal-gallery">
      <div class="modal-main-img">
        <img id="modal-main-view" src="${escapeHtml(imgUrl(images[0], BASE))}" alt="${escapeHtml(product.name)}" width="800" height="1000" />
      </div>
      ${images.length > 1 ? `
        <div class="modal-thumbs">
          ${images.map((img, idx) => `
            <button type="button" class="modal-thumb${idx === 0 ? ' is-active' : ''}" data-idx="${idx}" aria-label="Ver foto ${idx + 1}">
              <img src="${escapeHtml(imgUrl(img, BASE))}" alt="" />
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <div class="modal-details">
      <span class="modal-category">${escapeHtml(product.category)}</span>
      <h2 class="modal-title" id="modal-p-title">${escapeHtml(product.name)}</h2>
      <p class="modal-price">${cop(product.price)} COP</p>

      <div class="modal-stock-status${sold ? ' is-out' : ''}">
        ${sold ? '● Agotado temporalmente' : `● Disponible (${product.stock} en inventario)`}
      </div>

      <p class="modal-description">${escapeHtml(product.description || 'Joya elaborada en oro laminado de tres capas. Acabado brillante y duradero para uso diario.')}</p>

      ${!sold ? `
        <div class="modal-qty-row">
          <label for="modal-qty">Cantidad:</label>
          <div class="qty-stepper">
            <button type="button" class="qty-btn" id="modal-qty-minus" aria-label="Disminuir">−</button>
            <span class="qty-value" id="modal-qty-val">1</span>
            <button type="button" class="qty-btn" id="modal-qty-plus" aria-label="Aumentar">+</button>
          </div>
        </div>

        <button type="button" class="btn btn-gold btn-block" id="modal-btn-add">Agregar al carrito</button>
        <a class="btn btn-ghost btn-block" id="modal-btn-wa" href="${escapeHtml(waLink(productMsg(product), currentWhatsApp))}" target="_blank" rel="noopener noreferrer">
          Pedir por WhatsApp
        </a>
      ` : `
        <a class="btn btn-gold btn-block" id="modal-btn-wa" href="${escapeHtml(waLink(`Hola, ¿cuándo vuelve a estar disponible ${product.name}?`, currentWhatsApp))}" target="_blank" rel="noopener noreferrer">
          Consultar por WhatsApp
        </a>
      `}
    </div>
  `;

  // Miniaturas
  modalContent.querySelectorAll('.modal-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const idx = Number(thumb.dataset.idx);
      currentImgIndex = idx;
      modalContent.querySelector('#modal-main-view').src = imgUrl(images[idx], BASE);
      modalContent.querySelectorAll('.modal-thumb').forEach((t) => t.classList.toggle('is-active', t === thumb));
    });
  });

  // Selector de cantidad y botones
  if (!sold) {
    const valEl = modalContent.querySelector('#modal-qty-val');
    modalContent.querySelector('#modal-qty-minus').addEventListener('click', () => {
      if (selectedQty > 1) { selectedQty--; valEl.textContent = selectedQty; }
    });
    modalContent.querySelector('#modal-qty-plus').addEventListener('click', () => {
      if (selectedQty < (product.stock || 99)) { selectedQty++; valEl.textContent = selectedQty; }
    });

    modalContent.querySelector('#modal-btn-add').addEventListener('click', () => {
      addToCart(product, selectedQty);
      trackEvent('add_to_cart', product.id);
      sendGA4('add_to_cart', { item_name: product.name, price: product.price, quantity: selectedQty });
      closeModal();
      openCart();
    });
  }

  const waBtn = modalContent.querySelector('#modal-btn-wa');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      trackEvent('whatsapp_click', product.id);
      sendGA4('generate_lead', { method: 'WhatsApp Modal', product_name: product.name });
    });
  }

  modalBackdrop.classList.add('is-open');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModal() {
  modalBackdrop.classList.remove('is-open');
  modalBackdrop.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (window.location.hash.startsWith('#p/')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

function handleHashChange() {
  const hash = window.location.hash;
  if (hash.startsWith('#p/')) {
    const slug = hash.replace('#p/', '');
    const product = allProducts.find((p) => p.slug === slug);
    if (product) openProductModal(product);
  }
}

// ─────────────────────────────────────────────────────────────
//  CARRITO DE COMPRAS (DRAWER)
// ─────────────────────────────────────────────────────────────
function setupCart() {
  cartToggleBtn.addEventListener('click', openCart);
  cartCloseBtn.addEventListener('click', closeCart);
  cartBackdrop.addEventListener('click', closeCart);

  // Escuchar actualizaciones de carrito
  window.addEventListener('ed:cart-updated', renderCart);

  // Checkout por WhatsApp
  cartCheckoutBtn.addEventListener('click', () => {
    const cart = getCart();
    if (cart.length === 0) return;
    const city = cartCityInput.value.trim();
    const msg = buildOrderMessage(cart, city);
    const url = waLink(msg, currentWhatsApp);

    trackEvent('whatsapp_click');
    sendGA4('begin_checkout', { value: getCartTotal(), currency: 'COP' });

    window.open(url, '_blank', 'noopener,noreferrer');
  });

  // Render inicial
  renderCart();
}

function openCart() {
  renderCart();
  cartDrawer.classList.add('is-open');
  cartBackdrop.classList.add('is-open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  cartBackdrop.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-open');
}

function closeCart() {
  cartDrawer.classList.remove('is-open');
  cartBackdrop.classList.remove('is-open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  cartBackdrop.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cart-open');
}

function renderCart() {
  const cart = getCart();
  const count = getCartCount();
  const total = getCartTotal();

  // Actualizar badge del header
  cartBadge.textContent = count;
  cartBadge.dataset.count = String(count);

  // Actualizar total
  cartTotalPrice.textContent = cop(total);

  // Barra de envío gratis (si aplica)
  if (freeShippingMin > 0) {
    cartShippingNotice.hidden = false;
    const diff = freeShippingMin - total;
    if (diff <= 0) {
      shippingNoticeText.innerHTML = '🎉 ¡Tienes <strong>envío gratis</strong> a toda Colombia!';
      shippingBarFill.style.width = '100%';
    } else {
      const pct = Math.min(Math.round((total / freeShippingMin) * 100), 100);
      shippingNoticeText.innerHTML = `Agrega <strong>${cop(diff)}</strong> para tener <strong>envío gratis</strong>`;
      shippingBarFill.style.width = `${pct}%`;
    }
  } else {
    cartShippingNotice.hidden = true;
  }

  // Renderizar items
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <p>Tu carrito está vacío.</p>
        <p style="font-size: 0.85rem; color: var(--tiza-50);">Elige una joya del catálogo para comenzar tu pedido.</p>
      </div>
    `;
    cartCheckoutBtn.disabled = true;
    cartCheckoutBtn.style.opacity = '0.5';
    cartCheckoutBtn.style.pointerEvents = 'none';
  } else {
    cartCheckoutBtn.disabled = false;
    cartCheckoutBtn.style.opacity = '1';
    cartCheckoutBtn.style.pointerEvents = 'auto';

    cartItemsContainer.innerHTML = cart
      .map(
        (item) => `
      <article class="cart-item">
        <div class="cart-item-img">
          <img src="${escapeHtml(imgUrl(item.image, BASE))}" alt="${escapeHtml(item.name)}" />
        </div>
        <div class="cart-item-info">
          <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
          <p class="cart-item-price">${cop(item.price)}</p>
          <div class="cart-item-controls">
            <div class="qty-stepper" style="transform: scale(0.85); transform-origin: left;">
              <button type="button" class="qty-btn" data-cart-minus="${item.slug}">−</button>
              <span class="qty-value">${item.quantity}</span>
              <button type="button" class="qty-btn" data-cart-plus="${item.slug}">+</button>
            </div>
          </div>
        </div>
        <button type="button" class="cart-item-remove" data-cart-remove="${item.slug}" aria-label="Eliminar ${escapeHtml(item.name)}">
          ✕
        </button>
      </article>
    `
      )
      .join('');

    // Controles de cantidad
    cartItemsContainer.querySelectorAll('[data-cart-minus]').forEach((b) => {
      b.addEventListener('click', () => {
        const slug = b.dataset.cartMinus;
        const it = cart.find((i) => i.slug === slug);
        if (it) updateCartQuantity(slug, it.quantity - 1);
      });
    });

    cartItemsContainer.querySelectorAll('[data-cart-plus]').forEach((b) => {
      b.addEventListener('click', () => {
        const slug = b.dataset.cartPlus;
        const it = cart.find((i) => i.slug === slug);
        if (it) updateCartQuantity(slug, it.quantity + 1);
      });
    });

    cartItemsContainer.querySelectorAll('[data-cart-remove]').forEach((b) => {
      b.addEventListener('click', () => {
        removeFromCart(b.dataset.cartRemove);
      });
    });
  }
}

// ─────────────────────────────────────────────────────────────
//  NAVEGACIÓN, MENÚ MÓVIL Y SCROLL
// ─────────────────────────────────────────────────────────────
function setupNavigation() {
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

  const header = document.getElementById('site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add('is-visible');
              io.unobserve(en.target);
            }
          }),
        { threshold: 0.12 }
      )
    : null;
  document.querySelectorAll('.reveal').forEach((n) => (io ? io.observe(n) : n.classList.add('is-visible')));
}

// ─────────────────────────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sendGA4(eventName, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

// Arrancar al cargar el DOM
document.addEventListener('DOMContentLoaded', init);
