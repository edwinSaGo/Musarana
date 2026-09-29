// Se ejecuta en tiempo de BUILD (en tu máquina o en GitHub Actions), no en el navegador.
// Lee la URL del Web App de Apps Script desde una variable de entorno.
const APPS_SCRIPT_URL = import.meta.env.PUBLIC_APPS_SCRIPT_URL;

let cache = null;

/**
 * @typedef {Object} Variante
 * @property {string} id
 * @property {string} talla
 * @property {string} color
 * @property {number} precio
 * @property {number} stock_disponible
 * @property {string} sku
 */

/**
 * @typedef {Object} Upsell
 * @property {string} id
 * @property {string} nombre
 * @property {string} imagen
 * @property {number} precio_normal
 * @property {number} precio_especial
 */

/**
 * @typedef {Object} GuiaTalla
 * @property {string} categoria_id
 * @property {string} talla
 * @property {string} [medida_1_nombre]
 * @property {number} [medida_1_cm]
 * @property {string} [medida_2_nombre]
 * @property {number} [medida_2_cm]
 * @property {string} [medida_3_nombre]
 * @property {number} [medida_3_cm]
 */

/**
 * @typedef {Object} Producto
 * @property {string} id
 * @property {string} nombre
 * @property {string} slug
 * @property {string} descripcion
 * @property {number} precio_base
 * @property {boolean} tiene_variantes
 * @property {number|null} stock_disponible
 * @property {boolean} destacado
 * @property {string[]} categorias
 * @property {string[]} imagenes
 * @property {Variante[]} variantes
 * @property {Upsell[]} upsells
 * @property {GuiaTalla[]} guia_tallas
 */

/**
 * @typedef {Object} Categoria
 * @property {string} id
 * @property {string} nombre
 * @property {string} slug
 * @property {string} descripcion
 * @property {string} imagen
 */

/**
 * @typedef {Object} Catalogo
 * @property {Producto[]} productos
 * @property {Categoria[]} categorias
 * @property {Object.<string,string>} config
 */

/** @returns {Promise<Catalogo>} */
export async function getCatalogo() {
  if (cache) return cache;

  if (!APPS_SCRIPT_URL) {
    console.warn('⚠️  PUBLIC_APPS_SCRIPT_URL no está configurada. Usando catálogo vacío de respaldo.');
    return { productos: [], categorias: [] };
  }

  const res = await fetch(`${APPS_SCRIPT_URL}?accion=catalogo`);
  if (!res.ok) {
    throw new Error(`No se pudo obtener el catálogo: ${res.status}`);
  }
  cache = await res.json();
  return cache;
}