const { db } = require('../db');

// Órdenes que cuentan como venta realizada (excluye 'nueva' sin pagar y 'cancelada').
const ESTADOS_VENTA = "('pagada', 'enviada', 'entregada')";

function resumen() {
  const totales = db.prepare(`
    SELECT COUNT(*)                           AS ordenes_vendidas,
           COALESCE(ROUND(SUM(total), 2), 0)  AS total_ventas,
           COALESCE(ROUND(AVG(total), 2), 0)  AS valor_promedio_orden
    FROM ordenes
    WHERE estado IN ${ESTADOS_VENTA}
  `).get();

  // Importe bruto por categoría (cantidad x precio unitario, antes de descuento y envío)
  const ventasPorCategoria = db.prepare(`
    SELECT p.categoria,
           SUM(oi.cantidad)                               AS unidades,
           ROUND(SUM(oi.cantidad * oi.precio_unitario), 2) AS total
    FROM orden_items oi
    JOIN ordenes o   ON o.id = oi.orden_id
    JOIN productos p ON p.id = oi.producto_id
    WHERE o.estado IN ${ESTADOS_VENTA}
    GROUP BY p.categoria
    ORDER BY total DESC
  `).all();

  const top3Productos = db.prepare(`
    SELECT p.id, p.nombre, p.categoria, SUM(oi.cantidad) AS cantidad_vendida
    FROM orden_items oi
    JOIN ordenes o   ON o.id = oi.orden_id
    JOIN productos p ON p.id = oi.producto_id
    WHERE o.estado IN ${ESTADOS_VENTA}
    GROUP BY p.id
    ORDER BY cantidad_vendida DESC, p.nombre ASC
    LIMIT 3
  `).all();

  return {
    total_ventas: totales.total_ventas,
    ordenes_vendidas: totales.ordenes_vendidas,
    ventas_por_categoria: ventasPorCategoria,
    top_3_productos: top3Productos,
    valor_promedio_orden: totales.valor_promedio_orden,
  };
}

module.exports = { resumen };
