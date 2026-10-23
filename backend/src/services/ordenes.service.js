const { db, enTransaccion } = require('../db');
const config = require('../config');
const AppError = require('../utils/AppError');
const v = require('../utils/validaciones');
const cuponesService = require('./cupones.service');

const ESTADOS = ['nueva', 'pagada', 'enviada', 'entregada', 'cancelada'];

// Flujo normal; la cancelación se valida aparte.
const SIGUIENTE_ESTADO = {
  nueva: 'pagada',
  pagada: 'enviada',
  enviada: 'entregada',
};

const ESTADOS_CANCELABLES = ['nueva', 'pagada'];

function normalizarCiudad(ciudad) {
  return ciudad.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

function calcularEnvio(ciudadCliente, subtotalConDescuento) {
  const { ciudadLocal, costoLocal, costoOtrasCiudades, gratisDesde } = config.envio;
  if (subtotalConDescuento > gratisDesde) return 0;
  return normalizarCiudad(ciudadCliente) === normalizarCiudad(ciudadLocal)
    ? costoLocal
    : costoOtrasCiudades;
}

/** Valida el body y agrupa items repetidos del mismo producto. */
function validarNuevaOrden(body) {
  v.exigirCuerpo(body);
  const clienteId = v.exigirId(body.cliente_id, 'cliente_id');

  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw AppError.badRequest('El campo "items" debe ser un arreglo con al menos un producto');
  }
  const cantidades = new Map();
  body.items.forEach((item, i) => {
    if (item === null || typeof item !== 'object') {
      throw AppError.badRequest(`items[${i}] debe ser un objeto { producto_id, cantidad }`);
    }
    const productoId = v.exigirId(item.producto_id, `items[${i}].producto_id`);
    const cantidad = v.exigirEnteroPositivo(item.cantidad, `items[${i}].cantidad`);
    cantidades.set(productoId, (cantidades.get(productoId) || 0) + cantidad);
  });

  const cuponCodigo = body.cupon_codigo === undefined || body.cupon_codigo === null || body.cupon_codigo === ''
    ? null
    : v.exigirTexto(body.cupon_codigo, 'cupon_codigo');

  return { clienteId, cantidades, cuponCodigo };
}

function listar({ estado, cliente_id: clienteId } = {}) {
  const condiciones = [];
  const params = [];
  if (estado) {
    if (!ESTADOS.includes(estado)) throw AppError.badRequest(`Estado inválido. Valores permitidos: ${ESTADOS.join(', ')}`);
    condiciones.push('o.estado = ?');
    params.push(estado);
  }
  if (clienteId) {
    condiciones.push('o.cliente_id = ?');
    params.push(v.exigirId(clienteId, 'cliente_id'));
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  return db.prepare(`
    SELECT o.*, c.nombre AS cliente_nombre, cu.codigo AS cupon_codigo
    FROM ordenes o
    JOIN clientes c ON c.id = o.cliente_id
    LEFT JOIN cupones cu ON cu.id = o.cupon_id
    ${where}
    ORDER BY o.id DESC
  `).all(...params);
}

function obtener(idParam) {
  const id = v.exigirId(idParam);
  const orden = db.prepare(`
    SELECT o.*, c.nombre AS cliente_nombre, c.ciudad AS cliente_ciudad, cu.codigo AS cupon_codigo
    FROM ordenes o
    JOIN clientes c ON c.id = o.cliente_id
    LEFT JOIN cupones cu ON cu.id = o.cupon_id
    WHERE o.id = ?
  `).get(id);
  if (!orden) throw AppError.notFound(`Orden ${id} no encontrada`);

  orden.items = db.prepare(`
    SELECT oi.id, oi.producto_id, p.nombre AS producto_nombre, oi.cantidad, oi.precio_unitario,
           ROUND(oi.cantidad * oi.precio_unitario, 2) AS importe
    FROM orden_items oi
    JOIN productos p ON p.id = oi.producto_id
    WHERE oi.orden_id = ?
    ORDER BY oi.id
  `).all(id);
  return orden;
}

function crear(body) {
  const { clienteId, cantidades, cuponCodigo } = validarNuevaOrden(body);

  const ordenId = enTransaccion(() => {
    const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(clienteId);
    if (!cliente) throw AppError.notFound(`Cliente ${clienteId} no encontrado`);

    // 1. Verificar existencia y stock de cada producto
    const lineas = [];
    let subtotal = 0;
    for (const [productoId, cantidad] of cantidades) {
      const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(productoId);
      if (!producto) throw AppError.notFound(`Producto ${productoId} no encontrado`);
      if (cantidad > producto.stock) {
        throw AppError.conflict(
          `Stock insuficiente para "${producto.nombre}": disponible ${producto.stock}, solicitado ${cantidad}`,
        );
      }
      lineas.push({ productoId, cantidad, precioUnitario: producto.precio });
      subtotal += producto.precio * cantidad;
    }
    subtotal = v.redondear(subtotal);

    // 2. Cupón (opcional)
    const cupon = cuponCodigo ? cuponesService.validarParaCliente(cuponCodigo, clienteId) : null;
    const descuento = cupon ? v.redondear(subtotal * (cupon.porcentaje / 100)) : 0;

    // 3. Envío según ciudad, gratis si el subtotal con descuento supera el umbral
    const subtotalConDescuento = v.redondear(subtotal - descuento);
    const envio = calcularEnvio(cliente.ciudad, subtotalConDescuento);
    const total = v.redondear(subtotalConDescuento + envio);

    // 4. Guardar orden, items, descontar stock y consumir el cupón
    const { lastInsertRowid } = db.prepare(`
      INSERT INTO ordenes (cliente_id, cupon_id, estado, fecha, subtotal, descuento, envio, total)
      VALUES (?, ?, 'nueva', ?, ?, ?, ?, ?)
    `).run(clienteId, cupon ? cupon.id : null, new Date().toISOString(), subtotal, descuento, envio, total);

    const insertarItem = db.prepare(`
      INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)
    `);
    // La condición stock >= ? protege contra un descuento por debajo de cero.
    const descontarStock = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ? AND stock >= ?');

    for (const linea of lineas) {
      insertarItem.run(lastInsertRowid, linea.productoId, linea.cantidad, linea.precioUnitario);
      const { changes } = descontarStock.run(linea.cantidad, linea.productoId, linea.cantidad);
      if (changes === 0) throw AppError.conflict(`Stock insuficiente para el producto ${linea.productoId}`);
    }

    if (cupon) {
      const { changes } = db
        .prepare('UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = ? AND usos_actuales < usos_maximos')
        .run(cupon.id);
      if (changes === 0) throw AppError.conflict(`El cupón "${cupon.codigo}" alcanzó su límite de usos`);
    }

    return lastInsertRowid;
  });

  return obtener(ordenId);
}

function cambiarEstado(idParam, body) {
  const id = v.exigirId(idParam);
  v.exigirCuerpo(body);
  const nuevoEstado = v.exigirTexto(body.estado, 'estado').toLowerCase();
  if (!ESTADOS.includes(nuevoEstado)) {
    throw AppError.badRequest(`Estado inválido. Valores permitidos: ${ESTADOS.join(', ')}`);
  }

  enTransaccion(() => {
    const orden = db.prepare('SELECT id, estado FROM ordenes WHERE id = ?').get(id);
    if (!orden) throw AppError.notFound(`Orden ${id} no encontrada`);

    if (nuevoEstado === 'cancelada') {
      if (!ESTADOS_CANCELABLES.includes(orden.estado)) {
        throw AppError.conflict(
          `No se puede cancelar una orden en estado "${orden.estado}"; solo se permiten: ${ESTADOS_CANCELABLES.join(', ')}`,
        );
      }
      // Reponer el stock de todos los productos de la orden
      db.prepare(`
        UPDATE productos
        SET stock = stock + (
          SELECT SUM(oi.cantidad) FROM orden_items oi
          WHERE oi.orden_id = ? AND oi.producto_id = productos.id
        )
        WHERE id IN (SELECT producto_id FROM orden_items WHERE orden_id = ?)
      `).run(id, id);
    } else if (SIGUIENTE_ESTADO[orden.estado] !== nuevoEstado) {
      throw AppError.badRequest(`Transición inválida: "${orden.estado}" -> "${nuevoEstado}"`);
    }

    db.prepare('UPDATE ordenes SET estado = ? WHERE id = ?').run(nuevoEstado, id);
  });

  return obtener(id);
}

module.exports = { listar, obtener, crear, cambiarEstado, calcularEnvio };
