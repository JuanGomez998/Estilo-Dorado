// Convierte las fotos JPG de public/img/productos a WebP (mÃ¡s livianas).
// Uso: node scripts/to-webp.mjs
import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const dir = new URL('../public/img/productos/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
for (const f of await readdir(dir)) {
  if (!/\.jpe?g$/i.test(f)) continue;
  const out = join(dir, f.replace(/\.jpe?g$/i, '.webp'));
  const info = await sharp(join(dir, f)).resize({ width: 800, withoutEnlargement: true }).webp({ quality: 66, effort: 6 }).toFile(out);
  console.log(`${f} â†’ ${Math.round(info.size / 1024)} KB`);
}
