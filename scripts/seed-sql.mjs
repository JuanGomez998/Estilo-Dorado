// Genera los INSERT de productos de ejemplo dentro de supabase/schema.sql.
// Uso: node scripts/seed-sql.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { seedProducts } from '../src/data/seed.js';

const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const rows = seedProducts.map((p) =>
  `  (${q(p.name)}, ${q(p.slug)}, ${q(p.description)}, ${p.price}, ${q(p.category)}, array[${p.images.map(q).join(', ')}], ${p.stock}, ${p.is_featured}, true, ${q(p.badge)}, ${p.sort_order})`
);
const sql = `insert into public.products (name, slug, description, price, category, images, stock, is_featured, is_visible, badge, sort_order) values\n${rows.join(',\n')}\non conflict (slug) do nothing;`;

const file = new URL('../supabase/schema.sql', import.meta.url);
const src = await readFile(file, 'utf8');
const out = src.replace(/--SEED_PRODUCTS--[\s\S]*?(--END_SEED--|$)/, `--SEED_PRODUCTS--\n${sql}\n--END_SEED--\n`);
await writeFile(file, out);
console.log(`${seedProducts.length} productos escritos en schema.sql`);

