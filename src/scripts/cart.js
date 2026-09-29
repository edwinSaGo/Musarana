// =========================================================================
// MUSARAÑA — Lógica de carrito (100% en el navegador, sin backend propio)
// =========================================================================
const CLAVE_CARRITO = 'musarana_carrito';
const APPS_SCRIPT_URL = import.meta.env.PUBLIC_APPS_SCRIPT_URL;
const API_SECRET = import.meta.env.PUBLIC_API_SECRET;
// Nota de seguridad: como este es un sitio 100% estático sin servidor propio,
// este "secreto" viaja en el JS público del navegador. Solo sirve para frenar
// bots casuales, no es una barrera real — está bien porque el pago se verifica
// siempre a mano por ti antes de despachar nada.

function getCarrito() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
  } catch {
    return [];
  }
}

function setCarrito(items) {
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
  actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
  const el = document.getElementById('contador-carrito');
  if (!el) return;
  const total = getCarrito().reduce((acc, it) => acc + it.cantidad, 0);
  el.textContent = total;
}

function agregarAlCarrito(item) {
  const carrito = getCarrito();
  const existente = carrito.find(it => it.producto_id === item.producto_id && it.variante_id === item.variante_id);
  if (existente) {
    existente.cantidad += item.cantidad;
  } else {
    carrito.push(item);
  }
  setCarrito(carrito);
}

// ---------------------------------------------------------------------
// PÁGINA DE PRODUCTO: galería + variantes + botón añadir + popup upsells
// ---------------------------------------------------------------------
function initPaginaProducto() {
  const dataEl = document.getElementById('producto-data');
  if (!dataEl) return; // no estamos en una página de producto

  const producto = JSON.parse(dataEl.textContent);
  let seleccion = { talla: null, color: null };

  // Galería: click en miniatura cambia la imagen principal
  document.querySelectorAll('.miniatura').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('imagen-principal').src = btn.dataset.src;
      document.querySelectorAll('.miniatura').forEach(b => b.classList.remove('activa'));
      btn.classList.add('activa');
    });
  });

  // Selector de variantes
  document.querySelectorAll('.opcion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.tipo; // 'talla' o 'color'
      document.querySelectorAll(`.opcion-btn[data-tipo="${tipo}"]`).forEach(b => b.classList.remove('seleccionada'));
      btn.classList.add('seleccionada');
      seleccion[tipo] = btn.dataset.valor;
      actualizarInfoVariante(producto, seleccion);
    });
  });

  const btnGuiaTallas = document.getElementById('btn-guia-tallas');
  if (btnGuiaTallas) {
    btnGuiaTallas.addEventListener('click', () => mostrarModalTallas(producto.guia_tallas));
  }

  document.getElementById('btn-agregar-carrito').addEventListener('click', () => {
    const variante = producto.tiene_variantes ? encontrarVariante(producto, seleccion) : null;

    if (producto.tiene_variantes && !variante) {
      document.getElementById('mensaje-variante').textContent = 'Elige talla y color antes de continuar.';
      return;
    }
    if (producto.tiene_variantes && variante.stock_disponible <= 0) {
      document.getElementById('mensaje-stock').textContent = 'Esa combinación está agotada.';
      return;
    }
    if (!producto.tiene_variantes && producto.stock_disponible <= 0) {
      document.getElementById('mensaje-stock').textContent = 'Producto agotado.';
      return;
    }

    agregarAlCarrito({
      producto_id: producto.id,
      variante_id: variante ? variante.id : '',
      nombre: producto.nombre + (variante ? ` (${variante.talla || ''} ${variante.color || ''})`.trim() : ''),
      precio: variante ? variante.precio : producto.precio_base,
      cantidad: 1,
      imagen: producto.imagenes[0] || '',
    });

    if (producto.upsells && producto.upsells.length > 0) {
      mostrarModalUpsells(producto.upsells);
    } else {
      window.location.href = '/carrito/';
    }
  });
}

function encontrarVariante(producto, seleccion) {
  return producto.variantes.find(v =>
    (!seleccion.talla || v.talla === seleccion.talla) &&
    (!seleccion.color || v.color === seleccion.color)
  );
}

function actualizarInfoVariante(producto, seleccion) {
  const variante = encontrarVariante(producto, seleccion);
  if (!variante) return;
  document.getElementById('precio-mostrado').textContent = `$${Number(variante.precio).toLocaleString('es-CO')} COP`;
  document.getElementById('mensaje-stock').textContent = variante.stock_disponible > 0
    ? `${variante.stock_disponible} disponibles`
    : 'Agotado en esta combinación';
}

// ---------------------------------------------------------------------
// MODAL DE GUÍA DE TALLAS
// ---------------------------------------------------------------------
function mostrarModalTallas(guiaTallas) {
  const overlay = document.getElementById('modal-tallas');

  // Construye las columnas dinámicamente según qué medidas trae cada fila
  const nombresMedidas = [...new Set(
    guiaTallas.flatMap(g => [g.medida_1_nombre, g.medida_2_nombre, g.medida_3_nombre].filter(Boolean))
  )];

  overlay.innerHTML = `
    <div class="modal-caja modal-tallas-caja">
      <h2>📏 Guía de tallas</h2>
      <p>Medidas en centímetros. Si estás entre dos tallas, te recomendamos elegir la más grande.</p>
      <div class="tabla-tallas-wrap">
        <table class="tabla-tallas">
          <thead>
            <tr>
              <th>Talla</th>
              ${nombresMedidas.map(n => `<th>${n}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${guiaTallas.map(g => `
              <tr>
                <td>${g.talla}</td>
                ${nombresMedidas.map(nombre => {
                  const valor = [
                    g.medida_1_nombre === nombre ? g.medida_1_cm : null,
                    g.medida_2_nombre === nombre ? g.medida_2_cm : null,
                    g.medida_3_nombre === nombre ? g.medida_3_cm : null,
                  ].find(v => v !== null && v !== undefined && v !== '');
                  return `<td>${valor || '—'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <button id="btn-cerrar-tallas" class="btn">Cerrar</button>
    </div>
  `;
  overlay.hidden = false;
  document.getElementById('btn-cerrar-tallas').addEventListener('click', () => overlay.hidden = true);
}

// ---------------------------------------------------------------------
// POPUP DE UPSELLS — hasta 3 productos distintos, hasta 3 unidades c/u
// ---------------------------------------------------------------------
function mostrarModalUpsells(upsells) {
  const overlay = document.getElementById('modal-upsell');
  const cantidades = {}; // id -> cantidad seleccionada (0-3)
  upsells.forEach(u => cantidades[u.id] = 0);

  function render() {
    overlay.innerHTML = `
      <div class="modal-caja">
        <h2>¡Espera! Agrega esto por menos</h2>
        <p>Aprovecha estos extras a precio especial solo en este pedido.</p>
        <div class="modal-grid">
          ${upsells.map(u => `
            <div class="modal-item">
              <img src="${u.imagen}" alt="${u.nombre}" />
              <p class="modal-item-nombre">${u.nombre}</p>
              <p class="modal-item-precio">
                <span class="precio-tachado">$${Number(u.precio_normal).toLocaleString('es-CO')}</span>
                $${Number(u.precio_especial).toLocaleString('es-CO')}
              </p>
              <div class="stepper" data-id="${u.id}">
                <button class="stepper-menos" data-id="${u.id}">−</button>
                <span class="stepper-valor">${cantidades[u.id]}</span>
                <button class="stepper-mas" data-id="${u.id}">+</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="modal-acciones">
          <button id="btn-rechazar-upsells" class="btn">No, gracias</button>
          <button id="btn-continuar-upsells" class="btn btn-acento">Continuar con mi pedido</button>
        </div>
      </div>
    `;

    overlay.querySelectorAll('.stepper-mas').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (cantidades[id] < 3) cantidades[id]++;
        render();
      });
    });
    overlay.querySelectorAll('.stepper-menos').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (cantidades[id] > 0) cantidades[id]--;
        render();
      });
    });
    document.getElementById('btn-rechazar-upsells').addEventListener('click', cerrarYContinuar);
    document.getElementById('btn-continuar-upsells').addEventListener('click', () => {
      upsells.forEach(u => {
        if (cantidades[u.id] > 0) {
          agregarAlCarrito({
            producto_id: u.id,
            variante_id: '',
            nombre: u.nombre,
            precio: u.precio_especial,
            cantidad: cantidades[u.id],
            imagen: u.imagen,
          });
        }
      });
      cerrarYContinuar();
    });
  }

  function cerrarYContinuar() {
    overlay.hidden = true;
    window.location.href = '/carrito/';
  }

  overlay.hidden = false;
  render();
}

// ---------------------------------------------------------------------
// PÁGINA DE CARRITO / CHECKOUT
// ---------------------------------------------------------------------
function initPaginaCarrito() {
  const lista = document.getElementById('lista-carrito');
  if (!lista) return; // no estamos en la página de carrito

  // Mostrar/ocultar campos de dirección según el tipo de entrega elegido
  const radiosEntrega = document.querySelectorAll('input[name="tipo_entrega"]');
  const camposEnvio = document.getElementById('campos-envio');
  const infoRecogida = document.getElementById('info-recogida');

  function actualizarVistaEntrega() {
    const seleccion = document.querySelector('input[name="tipo_entrega"]:checked').value;
    camposEnvio.hidden = seleccion !== 'envio';
    infoRecogida.hidden = seleccion !== 'recogida';
  }
  radiosEntrega.forEach(r => r.addEventListener('change', actualizarVistaEntrega));
  actualizarVistaEntrega();

  function renderCarrito() {
    const carrito = getCarrito();
    if (carrito.length === 0) {
      lista.innerHTML = '<p>Tu carrito está vacío. <a href="/">Ir al catálogo</a>.</p>';
      document.getElementById('total-carrito').textContent = '';
      document.getElementById('form-checkout').hidden = true;
      return;
    }

    document.getElementById('form-checkout').hidden = false;
    lista.innerHTML = carrito.map((it, i) => `
      <div class="fila-carrito">
        <img src="${it.imagen}" alt="${it.nombre}" />
        <div class="fila-info">
          <p>${it.nombre}</p>
          <p>$${Number(it.precio).toLocaleString('es-CO')} c/u</p>
        </div>
        <div class="stepper">
          <button class="fila-menos" data-i="${i}">−</button>
          <span>${it.cantidad}</span>
          <button class="fila-mas" data-i="${i}">+</button>
        </div>
        <button class="fila-quitar" data-i="${i}">Quitar</button>
      </div>
    `).join('');

    const total = carrito.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
    document.getElementById('total-carrito').textContent = `Total: $${total.toLocaleString('es-CO')} COP`;

    lista.querySelectorAll('.fila-mas').forEach(b => b.addEventListener('click', () => {
      const carrito = getCarrito();
      carrito[b.dataset.i].cantidad++;
      setCarrito(carrito);
      renderCarrito();
    }));
    lista.querySelectorAll('.fila-menos').forEach(b => b.addEventListener('click', () => {
      const carrito = getCarrito();
      carrito[b.dataset.i].cantidad = Math.max(1, carrito[b.dataset.i].cantidad - 1);
      setCarrito(carrito);
      renderCarrito();
    }));
    lista.querySelectorAll('.fila-quitar').forEach(b => b.addEventListener('click', () => {
      const carrito = getCarrito();
      carrito.splice(b.dataset.i, 1);
      setCarrito(carrito);
      renderCarrito();
    }));
  }

  document.getElementById('form-checkout').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const boton = ev.target.querySelector('button[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Enviando...';

    const carrito = getCarrito();
    const tipoEntrega = document.querySelector('input[name="tipo_entrega"]:checked').value;
    const payload = {
      secret: API_SECRET,
      accion: 'crear_pedido',
      cliente_nombre: document.getElementById('input-nombre').value,
      cliente_telefono: document.getElementById('input-telefono').value,
      tipo_entrega: tipoEntrega,
      direccion: tipoEntrega === 'envio' ? document.getElementById('input-direccion').value : '',
      ciudad: tipoEntrega === 'envio' ? document.getElementById('input-ciudad').value : '',
      detalles_direccion: tipoEntrega === 'envio' ? document.getElementById('input-detalles').value : '',
      items: carrito.map(it => ({ producto_id: it.producto_id, variante_id: it.variante_id, cantidad: it.cantidad })),
    };

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        // text/plain evita el preflight CORS que Apps Script no maneja bien
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      const resultado = document.getElementById('resultado-pedido');
      if (data.ok) {
        resultado.innerHTML = `
          <p><strong>¡Pedido recibido! #${data.pedido_id}</strong></p>
          <p>Total a pagar: $${Number(data.total).toLocaleString('es-CO')} COP</p>
          <p>Tienes ${data.minutos_para_pagar} minutos para transferir y avisarnos, o la reserva se libera.</p>
        `;
        setCarrito([]);
        document.getElementById('form-checkout').hidden = true;
        lista.innerHTML = '';
      } else {
        resultado.innerHTML = `<p>⚠️ ${data.error}</p>`;
        boton.disabled = false;
        boton.textContent = 'Confirmar pedido';
      }
    } catch (err) {
      document.getElementById('resultado-pedido').innerHTML = `<p>⚠️ Error de conexión, intenta de nuevo.</p>`;
      boton.disabled = false;
      boton.textContent = 'Confirmar pedido';
    }
  });

  renderCarrito();
}

// ---------------------------------------------------------------------
// MENÚ MÓVIL (hamburguesa)
// ---------------------------------------------------------------------
function initMenuMovil() {
  const btnAbrir = document.getElementById('btn-menu-movil');
  const btnCerrar = document.getElementById('btn-cerrar-menu');
  const nav = document.getElementById('nav-categorias');
  const overlay = document.getElementById('overlay-menu-movil');
  if (!btnAbrir || !nav || !overlay) return;

  function abrirMenu() {
    nav.classList.add('abierta');
    overlay.hidden = false;
    btnAbrir.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // evita scroll de fondo con el menú abierto
  }
  function cerrarMenu() {
    nav.classList.remove('abierta');
    overlay.hidden = true;
    btnAbrir.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  btnAbrir.addEventListener('click', abrirMenu);
  if (btnCerrar) btnCerrar.addEventListener('click', cerrarMenu);
  overlay.addEventListener('click', cerrarMenu);
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', cerrarMenu));

  // Si la pantalla crece a tamaño de escritorio con el menú abierto, lo reseteamos
  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) cerrarMenu();
  });
}

// ---------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  actualizarContadorCarrito();
  initMenuMovil();
  initPaginaProducto();
  initPaginaCarrito();
});