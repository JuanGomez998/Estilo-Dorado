# Estilo Dorado — Tienda Online & Panel de Administración

Sitio web oficial de **Estilo Dorado** (joyería en oro laminado de 3 capas, Medellín, Colombia).  
Incluye tienda pública estática optimizada para SEO y conversión a WhatsApp, y un **Panel de Administración privado en `/admin/`** respaldado por Supabase.

---

## 🚀 Guía de Puesta en Marcha (Paso a Paso)

Sigue estos 5 pasos para conectar tu backend en Supabase y comenzar a administrar la tienda desde tu celular o computadora.

---

### Paso 1: Crear el proyecto en Supabase (Gratis)
1. Entra a [https://supabase.com](https://supabase.com) e inicia sesión o regístrate.
2. Haz clic en **"New project"** (Nuevo proyecto).
3. Asigna los datos:
   - **Name:** `Estilo Dorado`
   - **Database Password:** Elige una contraseña segura y guárdala.
   - **Region:** Selecciona la más cercana (ej. *South America (São Paulo)* o *East US*).
   - **Pricing Plan:** Free Plan.
4. Haz clic en **"Create new project"** y espera 1 minuto a que termine de aprovisionar la base de datos.

---

### Paso 2: Ejecutar el esquema SQL (`schema.sql`)
1. En el menú lateral izquierdo de tu proyecto en Supabase, ve a **SQL Editor** (ícono `>_`).
2. Haz clic en **"New query"** (o "Create snippet").
3. Abre el archivo [`supabase/schema.sql`](./supabase/schema.sql) de este proyecto, copia todo su contenido y pégalo en el editor de Supabase.
4. Presiona el botón verde **"Run"** (o Ctrl + Enter).
5. Verás el mensaje `Success. No rows returned`. Esto creará automáticamente:
   - Las tablas `products`, `reviews`, `settings`, `events` y `admins`.
   - Las políticas de seguridad (Row Level Security) que protegen tu información.
   - El bucket de almacenamiento público `productos` para las fotos.
   - La carga inicial con las 14 piezas de catálogo y ajustes por defecto.

---

### Paso 3: Crear tu usuario Administrador
Por seguridad, el panel de administración no permite registros públicos; solo tú puedes entrar.

1. En Supabase, ve a **Authentication** (ícono de candado / usuarios) → pestaña **Users**.
2. Haz clic en el botón verde **"Add user"** → **"Create user"**.
3. Escribe tu correo electrónico personal y una contraseña segura.
4. Marca la casilla **"Auto Confirm User?"** para que no requiera confirmación por correo y haz clic en **"Create user"**.
5. En la lista de usuarios, copia el **User UID** de tu usuario (es un código largo con guiones, por ejemplo `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).
6. Vuelve a **SQL Editor** → **New query**, pega y ejecuta este comando reemplazando el código por tu UID copiado:

```sql
insert into public.admins (user_id) values ('PEGA_AQUI_TU_USER_UID');
```

¡Listo! Tu usuario ya tiene permisos exclusivos para crear, editar, eliminar productos y ver analíticas.

---

### Paso 4: Configurar tus credenciales en `js/config.js`
1. En Supabase, ve a **Project Settings** (ícono de engranaje abajo a la izquierda) → **API**.
2. En la sección **Project API keys**, copia:
   - **Project URL** (ej. `https://xyzcompany.supabase.co`)
   - **anon public key** (código largo que empieza por `eyJ...`)
   > ⚠️ **IMPORTANTE:** Usa únicamente la clave **`anon` `public`**. **NUNCA** uses la clave `service_role`, ya que esa clave nunca debe exponerse en el navegador.
3. Abre el archivo [`public/js/config.js`](./public/js/config.js) (o [`js/config.js`](./js/config.js)) y reemplaza los marcadores:

```javascript
window.ED_CONFIG = {
  SUPABASE_URL: 'https://tu-proyecto.supabase.co',
  SUPABASE_ANON_KEY: 'tu_clave_anon_publica_aqui',
};
```

---

### Paso 5: Publicar en GitHub Pages
1. Guarda los cambios y haz commit:
   ```bash
   git add .
   git commit -m "Conectar Supabase y panel de administracion"
   git push
   ```
2. GitHub Actions compilará y publicará el sitio automáticamente en 1 o 2 minutos.
3. Puedes acceder a:
   - **Tienda pública:** `https://juangomez998.github.io/Estilo-Dorado/`
   - **Panel de administración:** `https://juangomez998.github.io/Estilo-Dorado/admin/`

---

## 📱 ¿Cómo usar el Panel de Administración desde tu Celular?
1. Entra desde tu navegador móvil a `https://juangomez998.github.io/Estilo-Dorado/admin/`.
2. Inicia sesión con el correo y contraseña que creaste en el **Paso 3**.
3. **Pestañas disponibles:**
   - **📊 Resumen:** Monitorea cuántos clics a WhatsApp, vistas de producto e intenciones de compra has tenido en los últimos 7 o 30 días.
   - **💎 Productos:**
     - Activa o desactiva productos al instante con el botón **Ocultar / Mostrar**.
     - Edita precios en COP, cantidades en inventario (stock) y etiquetas (*Nuevo*, *Más vendido*).
     - Agrega nuevas piezas tocando **+ Nuevo Producto**.
     - **Subir fotos desde el celular:** Toca *"Seleccionar o tomar fotos desde el celular"*. El sistema comprime automáticamente las fotos en tu teléfono antes de subirlas a la nube, ahorrando datos y garantizando velocidad de carga.
   - **⭐ Reseñas:** Agrega testimonios de clientes o modera cuáles se muestran en la página principal.
   - **⚙️ Ajustes:** Modifica el número de WhatsApp de ventas, el texto de la barra superior promocional, el monto mínimo para envío gratis o las políticas de garantía sin tocar una sola línea de código.

---

## 🛡️ Seguridad y Respaldo
- **Catálogo de Respaldo Estático:** Si por cualquier motivo Supabase no responde o el usuario no tiene conexión estable, la tienda muestra de inmediato las piezas en HTML estático sin pantallas en blanco ni fallos visuales.
- **Seguridad RLS (Row Level Security):** La base de datos solo permite lectura pública de piezas visibles. Solo un usuario autenticado y registrado en la tabla `admins` puede modificar la tienda o ver métricas.
- **Analítica Anónima:** Los eventos de clics y vistas se registran sin almacenar cookies invasivas ni datos personales, cumpliendo con buenas prácticas de privacidad.
