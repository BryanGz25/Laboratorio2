const AppError = require('../utils/AppError');

function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }

  // Restricciones de SQLite que se escapen de las validaciones del servicio
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(409).json({ error: 'La operación viola una relación entre registros' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor único' });
  }
  if (err.code === 'SQLITE_CONSTRAINT_CHECK' || err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
    return res.status(400).json({ error: 'Los datos enviados no cumplen las restricciones' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { rutaNoEncontrada, errorHandler };
