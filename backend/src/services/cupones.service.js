const { db } = require('../db');
const AppError = require('../utils/AppError');
const v = require('../utils/validaciones');

function listar() {
  return db.prepare('SELECT * FROM cupones ORDER BY id').all();
}

function obtenerPorCodigo(codigoParam) {
  const codigo = v.exigirTexto(codigoParam, 'codigo').toUpperCase();
  const cupon = db.prepare('SELECT * FROM cupones WHERE codigo = ?').get(codigo);
  if (!cupon) throw AppError.notFound(`Cupón "${codigo}" no encontrado`);
  return cupon;
}

function crear(body) {
  v.exigirCuerpo(body);
  const codigo = v.exigirTexto(body.codigo, 'codigo').toUpperCase();
  const porcentaje = v.exigirNumeroPositivo(body.porcentaje, 'porcentaje');
  if (porcentaje > 100) throw AppError.badRequest('El campo "porcentaje" no puede ser mayor que 100');
  const vigenteHasta = v.exigirFecha(body.vigente_hasta, 'vigente_hasta');
  const usosMaximos = v.exigirEnteroPositivo(body.usos_maximos, 'usos_maximos');

  if (db.prepare('SELECT 1 FROM cupones WHERE codigo = ?').get(codigo)) {
    throw AppError.conflict(`Ya existe un cupón con el código "${codigo}"`);
  }

  db.prepare(`INSERT INTO cupones (codigo, porcentaje, vigente_hasta, usos_maximos)
              VALUES (?, ?, ?, ?)`).run(codigo, porcentaje, vigenteHasta, usosMaximos);
  return obtenerPorCodigo(codigo);
}

/**
 * Reglas para aplicar un cupón en una orden. Se llama dentro de la
 * transacción de creación de la orden.
 *  - 400 si el código no existe.
 *  - 409 si está vencido, agotado o el cliente ya lo usó.
 */
function validarParaCliente(codigoParam, clienteId) {
  const codigo = v.exigirTexto(codigoParam, 'cupon_codigo').toUpperCase();
  const cupon = db.prepare('SELECT * FROM cupones WHERE codigo = ?').get(codigo);
  if (!cupon) throw AppError.badRequest(`El cupón "${codigo}" no es válido`);

  if (cupon.vigente_hasta < v.hoy()) {
    throw AppError.conflict(`El cupón "${codigo}" venció el ${cupon.vigente_hasta}`);
  }
  if (cupon.usos_actuales >= cupon.usos_maximos) {
    throw AppError.conflict(`El cupón "${codigo}" alcanzó su límite de usos`);
  }
  const yaUsado = db
    .prepare('SELECT 1 FROM ordenes WHERE cliente_id = ? AND cupon_id = ? LIMIT 1')
    .get(clienteId, cupon.id);
  if (yaUsado) {
    throw AppError.conflict(`El cliente ya utilizó el cupón "${codigo}"`);
  }
  return cupon;
}

module.exports = { listar, obtenerPorCodigo, crear, validarParaCliente };
