// ─────────────────────────────────────────────────────────────
//  CATÁLOGO DE PRODUCTOS — edita aquí nombres, precios y fotos.
//
//  Campos de cada producto:
//    id          → identificador único (sin espacios).
//    categoria   → uno de los "id" de categories.js.
//    nombre      → nombre visible. "" = se muestra "Pieza por nombrar".
//    precio      → número en COP sin puntos (ej. 89000). null = "Consultar precio".
//    descripcion → texto breve. "" = no se muestra.
//    imagen      → ruta dentro de /public (ej. "/img/productos/mi-foto.jpg").
//    alt         → descripción de la foto para lectores de pantalla.
//
//  Para agregar un producto copia un bloque { ... }, cámbiale el id y edítalo.
//  Para ocultarlo, bórralo o coméntalo con //.
// ─────────────────────────────────────────────────────────────

export const products = [
  {
    id: 'manilla-balines-cordon',
    categoria: 'manillas',
    nombre: 'Manilla de balines con cordón negro', // EDITAR
    precio: null,                                  // EDITAR
    descripcion: '',                               // EDITAR
    imagen: '/img/productos/manilla-balines-cordon.jpg',
    alt: 'Manilla de balines dorados lisos y tallados sobre cordón negro tejido',
  },
  {
    id: 'manilla-balines-medalla',
    categoria: 'manillas',
    nombre: 'Manilla de balines con medalla', // EDITAR
    precio: null,
    descripcion: '',
    imagen: '/img/productos/manilla-balines-medalla.jpg',
    alt: 'Manilla de cordón negro con balines dorados y una medalla central, sostenida en la mano',
  },
  {
    id: 'duo-cadena-topos',
    categoria: 'duos',
    nombre: 'Dúo cadena y topos', // EDITAR
    precio: null,
    descripcion: '',
    imagen: '/img/productos/duo-cadena-topos.jpg',
    alt: 'Juego de cadena dorada con medalla de la Virgen y topos a juego',
  },
  {
    id: 'cadena-trebol',
    categoria: 'dama',
    nombre: 'Cadena con trébol', // EDITAR
    precio: null,
    descripcion: '',
    imagen: '/img/productos/cadena-trebol.jpg',
    alt: 'Cadena dorada con dije de trébol cubierto de piedras claras',
  },
  {
    id: 'cadena-medalla',
    categoria: 'dama',
    nombre: 'Cadena con medalla', // EDITAR
    precio: null,
    descripcion: '',
    imagen: '/img/productos/cadena-medalla.jpg',
    alt: 'Cadena dorada delgada con pequeña medalla de la Virgen',
  },
  {
    id: 'cadena-caballero',
    categoria: 'caballero',
    nombre: 'Cadena tejido lazo', // EDITAR
    precio: null,
    descripcion: '',
    imagen: '/img/productos/cadena-caballero.jpg',
    alt: 'Cadena dorada de tejido torcido puesta sobre camiseta gris',
  },
  {
    id: 'dije-piedras-colores',
    categoria: 'dijes',
    nombre: 'Dije de la Virgen con piedras de colores', // EDITAR
    precio: null,
    descripcion: '',
    imagen: '/img/productos/dije-piedras-colores.jpg',
    alt: 'Dije dorado de la Virgen con piedras verdes, fucsia y claras',
  },
  {
    id: 'aretes-dijes',
    categoria: 'dijes',
    nombre: 'Aretes con dijes', // EDITAR
    precio: null,
    descripcion: '',
    imagen: '/img/productos/aretes-dijes.jpg',
    alt: 'Pieza dorada con dijes de corazón, ancla y cruz',
  },
];
