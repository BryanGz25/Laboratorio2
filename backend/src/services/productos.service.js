const { db } = require('../db');
const AppError = require('../utils/AppError');
const v = require('../utils/validaciones');

function validarProducto(body) {
  v.exigirCuerpo(body);
  return {
    nombre: v.exigirTexto(body.nombre, 'nombre'),
    descripcion: v.textoOpcional(body.descripcion, 'descripcion'),
    precio: v.exigirNumeroPositivo(body.precio, 'precio'),
    stock: v.exigirEnteroNoNegativo(body.stock, 'stock'),
    categoria: v.exigirTexto(body.categoria, 'categoria'),
  };
}

function listar({ categoria } = {}) {
  if (categoria) {
    return db.prepare('SELECT * FROM productos WHERE categoria = ? ORDER BY nombre').all(categoria);
  }
  return db.prepare('SELECT * FROM productos ORDER BY nombre').all();
}

function obtener(idParam) {
  const id = v.exigirId(idParam);
  const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
  if (!producto) throw AppError.notFound(`Producto ${id} no encontrado`);
  return producto;
}

function crear(body) {
  const p = validarProducto(body);
  const { lastInsertRowid } = db
    .prepare(`INSERT INTO productos (nombre, descripcion, precio, stock, categoria)
              VALUES (@nombre, @descripcion, @precio, @stock, @categoria)`)
    .run(p);
  return obtener(lastInsertRowid);
}

function actualizar(idParam, body) {
  const id = v.exigirId(idParam);
  const p = validarProducto(body);
  const { changes } = db
    .prepare(`UPDATE productos
              SET nombre = @nombre, descripcion = @descripcion, precio = @precio,
                  stock = @stock, categoria = @categoria
              WHERE id = @id`)
    .run({ ...p, id });
  if (changes === 0) throw AppError.notFound(`Producto ${id} no encontrado`);
  return obtener(id);
}

function eliminar(idParam) {
  const id = v.exigirId(idParam);
  obtener(id);
  const enOrdenes = db.prepare('SELECT 1 FROM orden_items WHERE producto_id = ? LIMIT 1').get(id);
  if (enOrdenes) {
    throw AppError.conflict(`El producto ${id} tiene órdenes asociadas y no se puede eliminar`);
  }
  db.prepare('DELETE FROM productos WHERE id = ?').run(id);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
