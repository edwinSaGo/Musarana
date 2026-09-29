// =========================================================================
// MUSARAÑA — Catálogo de experiencias WebAR (MindAR, tracking por imagen)
// -------------------------------------------------------------------------
// Cada objeto es UNA experiencia con su propio código QR y su propia página
// (/ar/tu-slug/). Puedes crear la página (y el QR que apunta a ella) ANTES
// de tener el contenido final: mientras "disponible" sea false, la página
// muestra un aviso de "muy pronto" en vez de fallar. Así el QR impreso en
// un producto físico nunca queda roto, aunque el contenido llegue después.
//
// Para activar una experiencia:
// 1. Genera tu archivo .mind a partir de la imagen que quieres trackear
//    (herramienta oficial: https://hiukim.github.io/mind-ar-js-doc/tools/compile).
// 2. Sube ese archivo .mind y tu modelo .glb a /public/ar/ (carpeta a crear).
// 3. Completa los campos de abajo y pon disponible: true.
// =========================================================================
export const experienciasAR = [
  {
    slug: 'experiencia-1',
    titulo: 'Experiencia AR #1',
    descripcion: 'Escanea el empaque para desbloquear esto.',
    imagenPreview: '', // imagen de portada para la tarjeta del menú
    archivoTarget: '/ar/experiencia-1.mind', // placeholder, reemplázalo
    modelo3d: '/ar/experiencia-1.glb',       // placeholder, reemplázalo
    escala: '0.05 0.05 0.05',                // ajusta el tamaño del modelo 3D
    disponible: false,
  },
  // Copia el bloque de arriba para agregar más experiencias (experiencia-2, etc.)
];
