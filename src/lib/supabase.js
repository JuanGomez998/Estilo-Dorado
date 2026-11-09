// Cliente de Supabase. Lee la URL y la anon key de /js/config.js.
// Se carga bajo demanda para no frenar la primera pintura de la página.
let clientPromise = null;

export function hasConfig() {
  const c = window.ED_CONFIG || {};
  return /^https:\/\/.+/.test(c.SUPABASE_URL || '') && !!c.SUPABASE_ANON_KEY && !/PEGA_AQUI/.test(c.SUPABASE_ANON_KEY);
}

export function getClient() {
  if (!hasConfig()) return Promise.resolve(null);
  clientPromise ||= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(window.ED_CONFIG.SUPABASE_URL, window.ED_CONFIG.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  );
  return clientPromise;
}

