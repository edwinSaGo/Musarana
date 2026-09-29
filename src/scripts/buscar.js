// =========================================================================
// MUSARAÑA — Filtro de búsqueda (texto + categoría + talla), 100% en el navegador.
// Todos los productos ya están renderizados como tarjetas en la página;
// este script solo muestra/oculta según los filtros, no hace peticiones nuevas.
// =========================================================================
function initBuscar() {
  const grilla = document.getElementById('grilla-resultados');
  if (!grilla) return; // no estamos en la página de búsqueda

  const inputTexto = document.getElementById('filtro-texto');
  const selectCategoria = document.getElementById('filtro-categoria');
  const selectTalla = document.getElementById('filtro-talla');
  const tarjetas = Array.from(grilla.querySelectorAll('.ficha-producto'));
  const contador = document.getElementById('contador-resultados');
  const sinResultados = document.getElementById('sin-resultados');

  function aplicarFiltros() {
    const texto = inputTexto.value.trim().toLowerCase();
    const categoria = selectCategoria.value;
    const talla = selectTalla ? selectTalla.value : '';

    let visibles = 0;

    tarjetas.forEach(card => {
      const coincideTexto = !texto ||
        card.dataset.nombre.includes(texto) ||
        card.dataset.descripcion.includes(texto);

      const coincideCategoria = !categoria || card.dataset.categorias.split(',').includes(categoria);
      const coincideTalla = !talla || card.dataset.tallas.split(',').includes(talla);

      const visible = coincideTexto && coincideCategoria && coincideTalla;
      card.style.display = visible ? '' : 'none';
      if (visible) visibles++;
    });

    contador.textContent = `${visibles} producto${visibles === 1 ? '' : 's'} encontrado${visibles === 1 ? '' : 's'}`;
    sinResultados.hidden = visibles !== 0;
  }

  inputTexto.addEventListener('input', aplicarFiltros);
  selectCategoria.addEventListener('change', aplicarFiltros);
  if (selectTalla) selectTalla.addEventListener('change', aplicarFiltros);

  aplicarFiltros();
}

document.addEventListener('DOMContentLoaded', initBuscar);
