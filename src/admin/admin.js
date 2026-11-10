// Panel de administración de Estilo Dorado
import { hasConfig, getClient } from '../lib/supabase.js';
import { cop, slugify, imgUrl } from '../lib/shop.js';

const BASE = import.meta.env.BASE_URL || '/';

let supabase = null;
let currentUser = null;
let currentProducts = [];
let currentReviews = [];
let editingProductImages = [];
let analyticsDays = 7;

// Elementos DOM
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const configWarning = document.getElementById('config-warning');
const userEmailBadge = document.getElementById('user-email-badge');
const logoutBtn = document.getElementById('logout-btn');
const toastEl = document.getElementById('admin-toast');

// Pestañas
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.admin-tab-pane');

// Modal producto
const productModal = document.getElementById('product-editor-modal');
const productForm = document.getElementById('product-editor-form');
const pTitle = document.getElementById('product-editor-title');
const pCloseBtn = document.getElementById('product-editor-close');
const pCancelBtn = document.getElementById('product-editor-cancel');
const pPhotoInput = document.getElementById('p-photo-input');
const btnPickPhotos = document.getElementById('btn-pick-photos');
const photosPreviewStrip = document.getElementById('photos-preview-strip');

// Modal reseña
const reviewModal = document.getElementById('review-editor-modal');
const reviewForm = document.getElementById('review-editor-form');
const rTitle = document.getElementById('review-editor-title');
const rCloseBtn = document.getElementById('review-editor-close');
const rCancelBtn = document.getElementById('review-editor-cancel');

// ─────────────────────────────────────────────────────────────
//  INICIO Y AUTENTICACIÓN
// ─────────────────────────────────────────────────────────────
async function initAdmin() {
  if (!hasConfig()) {
    configWarning.hidden = false;
  }

  supabase = await getClient();
  if (!supabase) {
    showAuthScreen();
    return;
  }

  // Verificar sesión existente
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user) {
    const isOk = await verifyAdminUser(session.user);
    if (isOk) {
      showDashboard(session.user);
      return;
    }
  }

  showAuthScreen();

  // Escuchar cambios de autenticación
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const isOk = await verifyAdminUser(session.user);
      if (isOk) showDashboard(session.user);
    } else if (event === 'SIGNED_OUT') {
      showAuthScreen();
    }
  });

  // Login handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Verificando...';

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const isOk = await verifyAdminUser(data.user);
      if (!isOk) {
        await supabase.auth.signOut();
        throw new Error('Tu usuario no está registrado en la tabla "admins" de Supabase. Revisa el README.md.');
      }

      showDashboard(data.user);
    } catch (err) {
      loginError.textContent = err.message || 'Error al iniciar sesión';
      loginError.hidden = false;
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Ingresar al panel';
    }
  });

  // Logout handler
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showAuthScreen();
  });

  setupNavigation();
  setupProductEditor();
  setupReviewEditor();
  setupSettingsForm();
  setupAnalyticsControls();
}

async function verifyAdminUser(user) {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error || !data) return false;
    return true;
  } catch (err) {
    return false;
  }
}

function showAuthScreen() {
  authScreen.hidden = false;
  dashboardScreen.hidden = true;
}

function showDashboard(user) {
  currentUser = user;
  authScreen.hidden = true;
  dashboardScreen.hidden = false;
  userEmailBadge.textContent = user.email || 'Admin';

  // Cargar datos
  loadAnalytics();
  loadProducts();
  loadReviews();
  loadSettings();
}

function showToast(message, type = 'success') {
  toastEl.textContent = message;
  toastEl.className = `admin-toast is-visible is-${type}`;
  setTimeout(() => {
    toastEl.classList.remove('is-visible');
  }, 3500);
}

// ─────────────────────────────────────────────────────────────
//  PESTAÑAS
// ─────────────────────────────────────────────────────────────
function setupNavigation() {
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach((b) => b.classList.toggle('active', b === btn));
      tabPanes.forEach((p) => p.classList.toggle('active', p.id === `tab-${target}`));

      if (target === 'resumen') loadAnalytics();
      else if (target === 'productos') loadProducts();
      else if (target === 'resenas') loadReviews();
      else if (target === 'ajustes') loadSettings();
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  1. RESUMEN / ANALÍTICA
// ─────────────────────────────────────────────────────────────
function setupAnalyticsControls() {
  document.querySelectorAll('.pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill-btn').forEach((b) => b.classList.toggle('active', b === btn));
      analyticsDays = Number(btn.dataset.days) || 7;
      loadAnalytics();
    });
  });
}

async function loadAnalytics() {
  const statWaEl = document.getElementById('stat-wa-clicks');
  const statViewsEl = document.getElementById('stat-views');
  const statCartEl = document.getElementById('stat-cart-adds');
  const tableBody = document.getElementById('stats-products-table');

  const cutoff = new Date(Date.now() - analyticsDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('type, product_id, created_at')
      .gte('created_at', cutoff);

    if (error) throw error;

    let waClicks = 0;
    let views = 0;
    let cartAdds = 0;
    const perProduct = {};

    (events || []).forEach((ev) => {
      if (ev.type === 'whatsapp_click') waClicks++;
      if (ev.type === 'product_view') views++;
      if (ev.type === 'add_to_cart') cartAdds++;

      if (ev.product_id) {
        if (!perProduct[ev.product_id]) perProduct[ev.product_id] = { views: 0, cart: 0, wa: 0 };
        if (ev.type === 'product_view') perProduct[ev.product_id].views++;
        if (ev.type === 'add_to_cart') perProduct[ev.product_id].cart++;
        if (ev.type === 'whatsapp_click') perProduct[ev.product_id].wa++;
      }
    });

    statWaEl.textContent = waClicks;
    statViewsEl.textContent = views;
    statCartEl.textContent = cartAdds;

    // Asegurar que tengamos los productos para mostrar nombres
    if (currentProducts.length === 0) {
      const { data: prods } = await supabase.from('products').select('id, name, slug');
      if (prods) currentProducts = prods;
    }

    const rows = Object.entries(perProduct)
      .map(([id, stats]) => {
        const prod = currentProducts.find((p) => p.id === id);
        return {
          name: prod ? prod.name : 'Pieza eliminada o general',
          views: stats.views,
          cart: stats.cart,
          wa: stats.wa,
        };
      })
      .sort((a, b) => b.wa - a.wa || b.views - a.views);

    if (rows.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 2rem; color: var(--tiza-50);">Aún no hay interacciones registradas en este período.</td></tr>';
    } else {
      tableBody.innerHTML = rows
        .map(
          (r) => `<tr>
        <td><strong>${escapeHtml(r.name)}</strong></td>
        <td>${r.views}</td>
        <td>${r.cart}</td>
        <td><strong style="color: var(--oro);">${r.wa}</strong></td>
      </tr>`
        )
        .join('');
    }
  } catch (err) {
    console.error('Error cargando analítica:', err);
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--danger); padding: 1.5rem;">Error: ${escapeHtml(err.message)}</td></tr>`;
  }
}

// ─────────────────────────────────────────────────────────────
//  2. PRODUCTOS
// ─────────────────────────────────────────────────────────────
async function loadProducts() {
  const container = document.getElementById('products-list-container');
  container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--tiza-70);">Cargando catálogo...</div>';

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    currentProducts = data || [];
    renderProductsList();
  } catch (err) {
    container.innerHTML = `<div style="padding: 2rem; color: var(--danger);">Error cargando productos: ${escapeHtml(err.message)}</div>`;
  }
}

function renderProductsList() {
  const container = document.getElementById('products-list-container');
  const query = (document.getElementById('product-search-input').value || '').toLowerCase();

  const filtered = currentProducts.filter(
    (p) => p.name.toLowerCase().includes(query) || (p.category || '').toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--tiza-50);">No hay productos que coincidan.</div>';
    return;
  }

  container.innerHTML = filtered
    .map((p, idx) => {
      const isVisible = p.is_visible;
      const isFeatured = p.is_featured;
      const thumb = p.images?.[0] || 'img/placeholder.svg';

      return `
      <article class="admin-product-row${!isVisible ? ' is-hidden' : ''}" data-id="${p.id}">
        <div class="p-thumb">
          <img src="${escapeHtml(imgUrl(thumb, BASE))}" alt="" />
        </div>
        <div class="p-info">
          <h4 class="p-title">${escapeHtml(p.name)}</h4>
          <div class="p-meta">
            <span class="p-category">${escapeHtml(p.category)}</span>
            <span class="p-price">${cop(p.price)}</span>
            <span class="${p.stock < 3 ? 'p-stock-low' : 'p-stock'}">Stock: ${p.stock}</span>
            ${p.badge ? `<span style="color: var(--oro); font-weight: 600;">[${escapeHtml(p.badge)}]</span>` : ''}
            ${isFeatured ? '<span style="color: #60A5FA;">★ Destacado</span>' : ''}
            ${!isVisible ? '<span style="color: var(--danger);">Oculto</span>' : ''}
          </div>
        </div>
        <div class="p-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-action="up" data-idx="${idx}" title="Subir orden" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="down" data-idx="${idx}" title="Bajar orden" ${idx === filtered.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="toggle-vis" data-id="${p.id}">
            ${isVisible ? 'Ocultar' : 'Mostrar'}
          </button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="edit" data-id="${p.id}">Editar</button>
          <button type="button" class="btn btn-ghost btn-sm" style="color: #F87171;" data-action="delete" data-id="${p.id}">Eliminar</button>
        </div>
      </article>
    `;
    })
    .join('');

  // Eventos de los botones de cada fila
  container.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const prod = currentProducts.find((p) => p.id === id);

      if (action === 'toggle-vis' && prod) {
        const next = !prod.is_visible;
        const { error } = await supabase.from('products').update({ is_visible: next }).eq('id', id);
        if (error) showToast(error.message, 'error');
        else {
          prod.is_visible = next;
          renderProductsList();
          showToast(`Producto ${next ? 'visible' : 'oculto'}`);
        }
      } else if (action === 'edit' && prod) {
        openProductEditor(prod);
      } else if (action === 'delete' && prod) {
        if (confirm(`¿Eliminar definitivamente "${prod.name}"?`)) {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) showToast(error.message, 'error');
          else {
            currentProducts = currentProducts.filter((p) => p.id !== id);
            renderProductsList();
            showToast('Producto eliminado');
          }
        }
      } else if (action === 'up' || action === 'down') {
        const idx = Number(btn.dataset.idx);
        const targetIdx = action === 'up' ? idx - 1 : idx + 1;
        if (targetIdx >= 0 && targetIdx < currentProducts.length) {
          const a = currentProducts[idx];
          const b = currentProducts[targetIdx];
          const tempOrder = a.sort_order;
          a.sort_order = b.sort_order || (idx + 1) * 10;
          b.sort_order = tempOrder || (targetIdx + 1) * 10;

          await Promise.all([
            supabase.from('products').update({ sort_order: a.sort_order }).eq('id', a.id),
            supabase.from('products').update({ sort_order: b.sort_order }).eq('id', b.id),
          ]);
          currentProducts.sort((x, y) => (x.sort_order || 0) - (y.sort_order || 0));
          renderProductsList();
        }
      }
    });
  });
}

// Búsqueda de productos
document.getElementById('product-search-input').addEventListener('input', renderProductsList);
document.getElementById('btn-new-product').addEventListener('click', () => openProductEditor(null));

// ─────────────────────────────────────────────────────────────
//  EDITOR DE PRODUCTOS Y SUBIDA DE FOTOS CON COMPRESIÓN
// ─────────────────────────────────────────────────────────────
function setupProductEditor() {
  pCloseBtn.addEventListener('click', closeProductEditor);
  pCancelBtn.addEventListener('click', closeProductEditor);

  // Auto-slug
  document.getElementById('p-edit-name').addEventListener('input', (e) => {
    const id = document.getElementById('p-edit-id').value;
    if (!id) {
      document.getElementById('p-edit-slug').value = slugify(e.target.value);
    }
  });

  // Selector de fotos
  btnPickPhotos.addEventListener('click', () => pPhotoInput.click());
  pPhotoInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    btnPickPhotos.disabled = true;
    btnPickPhotos.textContent = 'Comprimiendo y subiendo fotos...';

    for (const file of files) {
      try {
        const compressedBlob = await compressImageFile(file, 1000, 0.82);
        const slug = document.getElementById('p-edit-slug').value.trim() || 'prod';
        const fileName = `${slug}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;

        // Subir a Storage
        const { error: uploadError } = await supabase.storage
          .from('productos')
          .upload(fileName, compressedBlob, { contentType: 'image/webp', upsert: true });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: pubData } = supabase.storage.from('productos').getPublicUrl(fileName);
        if (pubData?.publicUrl) {
          editingProductImages.push(pubData.publicUrl);
          renderPhotosPreview();
        }
      } catch (err) {
        console.error('Error subiendo imagen:', err);
        showToast(`Error subiendo imagen: ${err.message}`, 'error');
      }
    }

    btnPickPhotos.disabled = false;
    btnPickPhotos.textContent = '📸 Seleccionar o tomar fotos desde el celular';
    pPhotoInput.value = '';
  });

  // Guardar producto
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('p-editor-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    const id = document.getElementById('p-edit-id').value || null;
    const name = document.getElementById('p-edit-name').value.trim();
    const slug = slugify(document.getElementById('p-edit-slug').value.trim() || name);
    const category = document.getElementById('p-edit-category').value.trim() || 'Otros';
    const price = parseInt(document.getElementById('p-edit-price').value, 10) || 0;
    const stock = parseInt(document.getElementById('p-edit-stock').value, 10) || 0;
    const badge = document.getElementById('p-edit-badge').value || null;
    const sort_order = parseInt(document.getElementById('p-edit-order').value, 10) || 10;
    const description = document.getElementById('p-edit-description').value.trim();
    const is_visible = document.getElementById('p-edit-visible').checked;
    const is_featured = document.getElementById('p-edit-featured').checked;

    const payload = {
      name,
      slug,
      category,
      price,
      stock,
      badge,
      sort_order,
      description,
      is_visible,
      is_featured,
      images: editingProductImages.length > 0 ? editingProductImages : ['img/placeholder.svg'],
    };

    try {
      if (id) {
        const { error } = await supabase.from('products').update(payload).eq('id', id);
        if (error) throw error;
        showToast('Producto actualizado correctamente');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        showToast('Producto creado con éxito');
      }

      closeProductEditor();
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar Producto';
    }
  });
}

function openProductEditor(product) {
  productForm.reset();
  editingProductImages = [];

  if (product) {
    pTitle.textContent = 'Editar Producto';
    document.getElementById('p-edit-id').value = product.id;
    document.getElementById('p-edit-name').value = product.name;
    document.getElementById('p-edit-slug').value = product.slug;
    document.getElementById('p-edit-category').value = product.category;
    document.getElementById('p-edit-price').value = product.price;
    document.getElementById('p-edit-stock').value = product.stock;
    document.getElementById('p-edit-badge').value = product.badge || '';
    document.getElementById('p-edit-order').value = product.sort_order || 10;
    document.getElementById('p-edit-description').value = product.description || '';
    document.getElementById('p-edit-visible').checked = product.is_visible;
    document.getElementById('p-edit-featured').checked = product.is_featured;
    editingProductImages = [...(product.images || [])];
  } else {
    pTitle.textContent = 'Nuevo Producto';
    document.getElementById('p-edit-id').value = '';
    document.getElementById('p-edit-order').value = (currentProducts.length + 1) * 10;
    document.getElementById('p-edit-visible').checked = true;
    document.getElementById('p-edit-featured').checked = false;
  }

  renderPhotosPreview();
  productModal.classList.add('is-open');
  productModal.setAttribute('aria-hidden', 'false');
}

function closeProductEditor() {
  productModal.classList.remove('is-open');
  productModal.setAttribute('aria-hidden', 'true');
}

function renderPhotosPreview() {
  if (editingProductImages.length === 0) {
    photosPreviewStrip.innerHTML = '<span style="font-size: 0.8rem; color: var(--tiza-50); padding: 0.5rem;">Sin fotos agregadas. Se usará el placeholder por defecto.</span>';
    return;
  }

  photosPreviewStrip.innerHTML = editingProductImages
    .map(
      (url, idx) => `
    <div class="photo-preview-item${idx === 0 ? ' is-cover' : ''}" title="${idx === 0 ? 'Foto de portada' : 'Toca para hacer portada'}" data-idx="${idx}">
      <img src="${escapeHtml(imgUrl(url, BASE))}" alt="" />
      <button type="button" class="photo-del-btn" data-del-idx="${idx}" title="Eliminar foto">✕</button>
    </div>
  `
    )
    .join('');

  photosPreviewStrip.querySelectorAll('.photo-preview-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('photo-del-btn')) return;
      const idx = Number(item.dataset.idx);
      if (idx > 0) {
        // Mover a portada
        const picked = editingProductImages.splice(idx, 1)[0];
        editingProductImages.unshift(picked);
        renderPhotosPreview();
      }
    });
  });

  photosPreviewStrip.querySelectorAll('.photo-del-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.delIdx);
      editingProductImages.splice(idx, 1);
      renderPhotosPreview();
    });
  });
}

/** Comprime una foto en el navegador usando Canvas antes de enviarla a Supabase Storage */
function compressImageFile(file, maxDimension = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Fallo al comprimir imagen en canvas'));
          },
          'image/webp',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────
//  3. RESEÑAS
// ─────────────────────────────────────────────────────────────
async function loadReviews() {
  const container = document.getElementById('reviews-list-container');
  container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--tiza-70);">Cargando reseñas...</div>';

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    currentReviews = data || [];
    renderReviewsList();
  } catch (err) {
    container.innerHTML = `<div style="padding: 2rem; color: var(--danger);">Error cargando reseñas: ${escapeHtml(err.message)}</div>`;
  }
}

function renderReviewsList() {
  const container = document.getElementById('reviews-list-container');
  if (currentReviews.length === 0) {
    container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--tiza-50);">No hay reseñas creadas. Crea una para exhibirla en la tienda.</div>';
    return;
  }

  container.innerHTML = currentReviews
    .map(
      (r) => `
    <article class="admin-review-card${!r.is_visible ? ' is-hidden' : ''}">
      <div class="r-header">
        <div>
          <span class="r-author">${escapeHtml(r.author)}</span>
          ${r.city ? `<span style="color: var(--tiza-50); font-size: 0.85rem;"> · ${escapeHtml(r.city)}</span>` : ''}
        </div>
        <div class="r-stars">${'★'.repeat(r.rating || 5)}</div>
      </div>
      <p class="r-text">“${escapeHtml(r.text)}”</p>
      <div class="r-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-r-action="toggle-vis" data-id="${r.id}">
          ${r.is_visible ? 'Ocultar' : 'Mostrar'}
        </button>
        <button type="button" class="btn btn-ghost btn-sm" data-r-action="edit" data-id="${r.id}">Editar</button>
        <button type="button" class="btn btn-ghost btn-sm" style="color: #F87171;" data-r-action="delete" data-id="${r.id}">Eliminar</button>
      </div>
    </article>
  `
    )
    .join('');

  container.querySelectorAll('[data-r-action]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.rAction;
      const id = btn.dataset.id;
      const r = currentReviews.find((x) => x.id === id);

      if (action === 'toggle-vis' && r) {
        const next = !r.is_visible;
        const { error } = await supabase.from('reviews').update({ is_visible: next }).eq('id', id);
        if (error) showToast(error.message, 'error');
        else {
          r.is_visible = next;
          renderReviewsList();
          showToast(`Reseña ${next ? 'visible' : 'oculta'}`);
        }
      } else if (action === 'edit' && r) {
        openReviewEditor(r);
      } else if (action === 'delete' && r) {
        if (confirm(`¿Eliminar la reseña de "${r.author}"?`)) {
          const { error } = await supabase.from('reviews').delete().eq('id', id);
          if (error) showToast(error.message, 'error');
          else {
            currentReviews = currentReviews.filter((x) => x.id !== id);
            renderReviewsList();
            showToast('Reseña eliminada');
          }
        }
      }
    });
  });
}

function setupReviewEditor() {
  rCloseBtn.addEventListener('click', closeReviewEditor);
  rCancelBtn.addEventListener('click', closeReviewEditor);
  document.getElementById('btn-new-review').addEventListener('click', () => openReviewEditor(null));

  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('r-editor-save-btn');
    saveBtn.disabled = true;

    const id = document.getElementById('r-edit-id').value || null;
    const author = document.getElementById('r-edit-author').value.trim();
    const city = document.getElementById('r-edit-city').value.trim();
    const rating = parseInt(document.getElementById('r-edit-rating').value, 10) || 5;
    const text = document.getElementById('r-edit-text').value.trim();
    const is_visible = document.getElementById('r-edit-visible').checked;

    const payload = { author, city, rating, text, is_visible };

    try {
      if (id) {
        const { error } = await supabase.from('reviews').update(payload).eq('id', id);
        if (error) throw error;
        showToast('Reseña actualizada');
      } else {
        const { error } = await supabase.from('reviews').insert(payload);
        if (error) throw error;
        showToast('Reseña creada con éxito');
      }
      closeReviewEditor();
      loadReviews();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });
}

function openReviewEditor(review) {
  reviewForm.reset();
  if (review) {
    rTitle.textContent = 'Editar Reseña';
    document.getElementById('r-edit-id').value = review.id;
    document.getElementById('r-edit-author').value = review.author;
    document.getElementById('r-edit-city').value = review.city || '';
    document.getElementById('r-edit-rating').value = review.rating || 5;
    document.getElementById('r-edit-text').value = review.text;
    document.getElementById('r-edit-visible').checked = review.is_visible;
  } else {
    rTitle.textContent = 'Nueva Reseña';
    document.getElementById('r-edit-id').value = '';
    document.getElementById('r-edit-visible').checked = true;
  }

  reviewModal.classList.add('is-open');
  reviewModal.setAttribute('aria-hidden', 'false');
}

function closeReviewEditor() {
  reviewModal.classList.remove('is-open');
  reviewModal.setAttribute('aria-hidden', 'true');
}

// ─────────────────────────────────────────────────────────────
//  4. AJUSTES
// ─────────────────────────────────────────────────────────────
async function loadSettings() {
  try {
    const { data, error } = await supabase.from('settings').select('key, value');
    if (error) throw error;

    (data || []).forEach((row) => {
      const field = document.querySelector(`[name="${row.key}"]`);
      if (field) field.value = row.value;
    });
  } catch (err) {
    showToast(`Error cargando ajustes: ${err.message}`, 'error');
  }
}

function setupSettingsForm() {
  const form = document.getElementById('settings-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-settings');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const formData = new FormData(form);
    const updates = [];

    for (const [key, value] of formData.entries()) {
      updates.push({ key, value: String(value).trim() });
    }

    try {
      const { error } = await supabase.from('settings').upsert(updates);
      if (error) throw error;
      showToast('Ajustes guardados correctamente');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar Ajustes';
    }
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', initAdmin);

