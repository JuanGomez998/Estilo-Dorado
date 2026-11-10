-- ═════════════════════════════════════════════════════════════════
--  ESTILO DORADO — Esquema de Supabase
--  Ejecútalo completo una sola vez en: Supabase → SQL Editor → New query.
--  Es seguro volver a ejecutarlo: no duplica datos de ejemplo.
-- ═════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─────────────── Administradores ───────────────
-- Solo los usuarios que estén en esta tabla pueden escribir en la tienda.
-- Después de crear tu usuario en Authentication, agrégalo aquí (ver README).
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ─────────────── Productos ───────────────
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  price       integer not null check (price >= 0),            -- COP, sin decimales
  category    text not null default 'Otros',
  images      text[] not null default '{}',                    -- URLs (la primera es la portada)
  stock       integer not null default 0 check (stock >= 0),
  is_featured boolean not null default false,
  is_visible  boolean not null default true,
  badge       text check (badge is null or badge in ('Nuevo', 'Más vendido')),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists products_visible_order_idx on public.products (is_visible, sort_order);

-- ─────────────── Reseñas ───────────────
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  author     text not null check (char_length(author) between 1 and 80),
  city       text not null default '',
  text       text not null check (char_length(text) between 1 and 600),
  rating     smallint not null default 5 check (rating between 1 and 5),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─────────────── Ajustes (clave / valor) ───────────────
create table if not exists public.settings (
  key   text primary key check (key in (
          'whatsapp_number', 'banner_text', 'banner_visible',
          'shipping_text', 'returns_text', 'warranty_text', 'free_shipping_min')),
  value text not null default ''
);

-- ─────────────── Eventos (analítica anónima) ───────────────
-- No guarda datos personales: solo tipo, producto y fecha.
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  type       text not null check (type in ('whatsapp_click', 'product_view', 'add_to_cart')),
  product_id uuid references public.products (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists events_created_idx on public.events (created_at desc);

-- ═════════════════════════════════════════════════════════════════
--  SEGURIDAD (Row Level Security)
-- ═════════════════════════════════════════════════════════════════
alter table public.admins   enable row level security;
alter table public.products enable row level security;
alter table public.reviews  enable row level security;
alter table public.settings enable row level security;
alter table public.events   enable row level security;

-- Limpia políticas previas para poder re-ejecutar el script.
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies
           where schemaname = 'public' and tablename in ('admins','products','reviews','settings','events')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- admins: solo un admin puede ver la lista
create policy "admins_select_admin" on public.admins
  for select to authenticated using (public.is_admin());

-- products: el público ve solo los visibles; el admin ve y edita todo
create policy "products_select_public" on public.products
  for select to anon, authenticated using (is_visible or public.is_admin());
create policy "products_insert_admin" on public.products
  for insert to authenticated with check (public.is_admin());
create policy "products_update_admin" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "products_delete_admin" on public.products
  for delete to authenticated using (public.is_admin());

-- reviews: el público ve solo las visibles; el admin todo
create policy "reviews_select_public" on public.reviews
  for select to anon, authenticated using (is_visible or public.is_admin());
create policy "reviews_insert_admin" on public.reviews
  for insert to authenticated with check (public.is_admin());
create policy "reviews_update_admin" on public.reviews
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reviews_delete_admin" on public.reviews
  for delete to authenticated using (public.is_admin());

-- settings: lectura pública; escritura solo admin
create policy "settings_select_public" on public.settings
  for select to anon, authenticated using (true);
create policy "settings_insert_admin" on public.settings
  for insert to authenticated with check (public.is_admin());
create policy "settings_update_admin" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "settings_delete_admin" on public.settings
  for delete to authenticated using (public.is_admin());

-- events: cualquiera puede registrar un evento válido; solo el admin puede leerlos o borrarlos
create policy "events_insert_public" on public.events
  for insert to anon, authenticated
  with check (type in ('whatsapp_click', 'product_view', 'add_to_cart'));
create policy "events_select_admin" on public.events
  for select to authenticated using (public.is_admin());
create policy "events_delete_admin" on public.events
  for delete to authenticated using (public.is_admin());

-- Permisos de tabla (RLS decide fila por fila).
revoke all on public.admins, public.products, public.reviews, public.settings, public.events from anon, authenticated;
grant select on public.products, public.reviews, public.settings to anon, authenticated;
grant insert, update, delete on public.products, public.reviews, public.settings to authenticated;
grant insert on public.events to anon, authenticated;
grant select, delete on public.events to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ═════════════════════════════════════════════════════════════════
--  STORAGE: bucket "productos" (fotos públicas, escritura solo admin)
-- ═════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "productos_read_public"  on storage.objects;
drop policy if exists "productos_insert_admin" on storage.objects;
drop policy if exists "productos_update_admin" on storage.objects;
drop policy if exists "productos_delete_admin" on storage.objects;

create policy "productos_read_public" on storage.objects
  for select to anon, authenticated using (bucket_id = 'productos');
create policy "productos_insert_admin" on storage.objects
  for insert to authenticated with check (bucket_id = 'productos' and public.is_admin());
create policy "productos_update_admin" on storage.objects
  for update to authenticated using (bucket_id = 'productos' and public.is_admin());
create policy "productos_delete_admin" on storage.objects
  for delete to authenticated using (bucket_id = 'productos' and public.is_admin());

-- ═════════════════════════════════════════════════════════════════
--  DATOS INICIALES (de ejemplo; edítalos luego desde /admin)
-- ═════════════════════════════════════════════════════════════════
insert into public.settings (key, value) values
  ('whatsapp_number', '573024242009'),
  ('banner_text', 'Envíos a todo Colombia · 5 años de garantía en el color'),
  ('banner_visible', 'true'),
  ('shipping_text', E'Enviamos a todo Colombia desde Medellín.\nLlega en 1 a 5 días hábiles.\nEl envío lo paga el comprador; te confirmamos el valor antes de despachar.'),
  ('returns_text', E'Tienes 15 días calendario desde que recibes tu pieza.\nDebe estar sin uso, en perfecto estado y con su empaque original.\nEl envío del cambio lo cubre el comprador.'),
  ('warranty_text', E'Cubre el color de la joya durante 5 años.\nNo cubre daños por mal uso, contacto con químicos ni arreglos hechos por terceros.\nPara reclamarla, escríbenos por WhatsApp con fotos de la pieza y la fecha de compra.'),
  ('free_shipping_min', '0')
on conflict (key) do nothing;

-- Reseñas iniciales de ejemplo (visibles)
insert into public.reviews (author, city, text, rating, is_visible) values
  ('Camila R.', 'Medellín', 'Compré la manilla de balines hace 6 meses y sigue igualita de brillante que el primer día. Excelente calidad.', 5, true),
  ('Andrés M.', 'Bogotá', 'La cadena tejido torcido tiene un peso y un brillo espectacular. El pedido llegó a Bogotá en 2 días.', 5, true),
  ('Valentina G.', 'Cali', 'Excelente atención por WhatsApp, me asesoraron súper bien para elegir el dúo para regalo. Recomendadísimos.', 5, true)
on conflict do nothing;

--SEED_PRODUCTS--
insert into public.products (name, slug, description, price, category, images, stock, is_featured, is_visible, badge, sort_order) values
  ('Manilla balines con cordón negro', 'manilla-balines-cordon-negro', 'Balines lisos y tallados sobre cordón tejido. La que más piden.', 38000, 'Manillas', array['img/productos/manilla-balines-cordon.webp'], 12, true, true, 'Más vendido', 10),
  ('Manilla eslabón cubano', 'manilla-eslabon-cubano', 'Eslabón cubano con peso y brillo para todos los días.', 45000, 'Manillas', array['img/placeholder.svg'], 8, false, true, 'Nuevo', 20),
  ('Manilla tejido plano', 'manilla-tejido-plano', 'Tejido plano que se acomoda a la muñeca sin enredarse.', 32000, 'Manillas', array['img/placeholder.svg'], 10, false, true, null, 30),
  ('Manilla rígida lisa', 'manilla-rigida-lisa', 'Rígida y lisa: minimalista, va con todo.', 42000, 'Manillas', array['img/placeholder.svg'], 6, false, true, null, 40),
  ('Cadena caballero tejido torcido', 'cadena-caballero-tejido-torcido', 'Tejido torcido con presencia, para llevar sola o en capas.', 58000, 'Cadenas', array['img/productos/cadena-caballero.webp'], 9, true, true, 'Más vendido', 50),
  ('Cadena cubana gruesa', 'cadena-cubana-gruesa', 'Cubana gruesa para quien no pasa desapercibido.', 75000, 'Cadenas', array['img/placeholder.svg'], 5, false, true, 'Nuevo', 60),
  ('Cadena rolo fina', 'cadena-rolo-fina', 'Rolo fino y discreto, perfecto para colgar un dije.', 48000, 'Cadenas', array['img/placeholder.svg'], 11, false, true, null, 70),
  ('Dúo manillas pareja balines', 'duo-manillas-pareja-balines', 'Dos manillas de balines para llevar en pareja.', 65000, 'Dúos', array['img/placeholder.svg'], 7, true, true, null, 80),
  ('Dúo cadena + manilla', 'duo-cadena-manilla', 'Cadena y manilla a juego, listas para regalar.', 98000, 'Dúos', array['img/placeholder.svg'], 4, false, true, null, 90),
  ('Dije cruz lisa', 'dije-cruz-lisa', 'Cruz de líneas limpias para tu cadena favorita.', 28000, 'Dijes', array['img/placeholder.svg'], 15, false, true, null, 100),
  ('Dije inicial (letra a elección)', 'dije-inicial', 'Tu inicial en dorado. Nos dices la letra por WhatsApp.', 30000, 'Dijes', array['img/placeholder.svg'], 20, false, true, null, 110),
  ('Dije medalla redonda', 'dije-medalla-redonda', 'Medalla redonda clásica, lista para tu cadena.', 26000, 'Dijes', array['img/placeholder.svg'], 12, false, true, null, 120),
  ('Anillo sello liso', 'anillo-sello-liso', 'Sello liso con carácter, sin exagerar.', 34000, 'Anillos', array['img/placeholder.svg'], 10, false, true, null, 130),
  ('Anillo trenzado', 'anillo-trenzado', 'Trenzado fino que brilla desde cualquier ángulo.', 29000, 'Anillos', array['img/placeholder.svg'], 14, false, true, null, 140)
on conflict (slug) do nothing;
--END_SEED--
