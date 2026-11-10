import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { seedProducts } from './src/data/seed.js';
import { cardHTML, jsonLd } from './src/lib/shop.js';

// GitHub Pages sirve el sitio en /Estilo-Dorado/, no en la raíz del dominio.
const base = '/Estilo-Dorado/';

// Inserta en index.html el catálogo de respaldo y su JSON-LD, como HTML estático,
// para que Google y las vistas previas lo lean aunque Supabase no responda.
const fallbackCatalog = () => ({
  name: 'fallback-catalog',
  transformIndexHtml(html) {
    return html
      .replace('<!--FALLBACK_PRODUCTS-->', seedProducts.map((p) => cardHTML(p, base)).join('\n'))
      .replace('<!--PRODUCTS_JSONLD-->', jsonLd(seedProducts, base));
  },
});

export default defineConfig({
  base,
  plugins: [fallbackCatalog()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        links: resolve(__dirname, 'links/index.html'),
      },
    },
  },
});
