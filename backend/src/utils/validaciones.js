const AppError = require('./AppError');

function esObjeto(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function exigirCuerpo(body) {
  if (!esObjeto(body)) throw AppError.badRequest('El cuerpo de la petición debe ser un objeto JSON');
  return body;
}

function exigirId(valor, campo = 'id') {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw AppError.badRequest(`El campo "${campo}" debe ser un entero positivo`);
  }
  return numero;
}

function exigirTexto(valor, campo) {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw AppError.badRequest(`El campo "${campo}" es obligatorio y debe ser texto`);
  }
  return valor.trim();
}

function textoOpcional(valor, campo) {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string') throw AppError.badRequest(`El campo "${campo}" debe ser texto`);
  return valor.trim() || null;
}

function exigirEnteroPositivo(valor, campo) {
  if (!Number.isInteger(valor) || valor <= 0) {
    throw AppError.badRequest(`El campo "${campo}" debe ser un entero mayor que 0`);
  }
  return valor;
}

function exigirEnteroNoNegativo(valor, campo) {
  if (!Number.isInteger(valor) || valor < 0) {
    throw AppError.badRequest(`El campo "${campo}" debe ser un entero mayor o igual a 0`);
  }
  return valor;
}

function exigirNumeroPositivo(valor, campo) {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    throw AppError.badRequest(`El campo "${campo}" debe ser un número mayor que 0`);
  }
  return valor;
}

/** Fecha de calendario estricta en formato YYYY-MM-DD. */
function exigirFecha(valor, campo) {
  const texto = exigirTexto(valor, campo);
  const fecha = new Date(`${texto}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto) || Number.isNaN(fecha.getTime())
    || fecha.toISOString().slice(0, 10) !== texto) {
    throw AppError.badRequest(`El campo "${campo}" debe ser una fecha válida con formato YYYY-MM-DD`);
  }
  return texto;
}

/** Fecha local de hoy en formato YYYY-MM-DD. */
function hoy() {
  return new Date().toLocaleDateString('sv-SE');
}

function redondear(monto) {
  return Math.round((monto + Number.EPSILON) * 100) / 100;
}

module.exports = {
  exigirCuerpo,
  exigirId,
  exigirTexto,
  textoOpcional,
  exigirEnteroPositivo,
  exigirEnteroNoNegativo,
  exigirNumeroPositivo,
  exigirFecha,
  hoy,
  redondear,
};
