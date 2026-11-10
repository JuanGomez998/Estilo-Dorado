// Cliente y helpers de Supabase para la tienda y el panel de administración.
let clientPromise = null;

export function hasConfig() {
  const c = window.ED_CONFIG || {};
  return (
    typeof c.SUPABASE_URL === 'string' &&
    c.SUPABASE_URL.startsWith('https://') &&
    typeof c.SUPABASE_ANON_KEY === 'string' &&
    c.SUPABASE_ANON_KEY.length > 20 &&
    !c.SUPABASE_ANON_KEY.includes('PEGA_AQUI')
  );
}

export async function getClient() {
  if (!hasConfig()) return null;
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(window.ED_CONFIG.SUPABASE_URL, window.ED_CONFIG.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    );
  }
  return clientPromise;
}

/** Carga los productos visibles desde Supabase. Si falla, devuelve null para usar el fallback. */
export async function fetchLiveProducts() {
  const supabase = await getClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[Estilo Dorado] No se pudieron cargar productos de Supabase, usando catálogo de respaldo:', err.message);
    return null;
  }
}

/** Carga los ajustes de la tienda. */
export async function fetchSettings() {
  const supabase = await getClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('settings').select('key, value');
    if (error) throw error;
    const map = {};
    (data || []).forEach((row) => { map[row.key] = row.value; });
    return map;
  } catch (err) {
    console.warn('[Estilo Dorado] Ajustes no disponibles en Supabase:', err.message);
    return null;
  }
}

/** Carga las reseñas visibles. */
export async function fetchLiveReviews() {
  const supabase = await getClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(6);
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[Estilo Dorado] Reseñas no disponibles:', err.message);
    return null;
  }
}

/** Registra un evento de analítica anónimo (sin datos personales). */
export async function trackEvent(type, productId = null) {
  try {
    const supabase = await getClient();
    if (!supabase) return;
    await supabase.from('events').insert({
      type,
      product_id: productId || null,
    });
  } catch (err) {
    // Falla silenciosa para no interrumpir al usuario
    console.debug('[Analytics event error]:', err?.message);
  }
}
