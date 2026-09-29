import { defineConfig } from 'astro/config';

export default defineConfig({
  // Cuando tengas el dominio musarana.lat configurado como dominio custom
  // en GitHub Pages, deja site así y NO uses "base".
  site: 'https://musarana.lat',
  output: 'static',

  // Si en cambio publicas SIN dominio propio en https://tuusuario.github.io/musarana-tienda/
  // (repo que no es "tuusuario.github.io"), descomenta la línea de abajo:
  // base: '/musarana-tienda',
});
