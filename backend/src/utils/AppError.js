/**
 * Error de negocio con código HTTP. Los servicios lo lanzan y el
 * middleware de errores lo convierte en `{ error: "mensaje" }`.
 */
class AppError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.name = 'AppError';
    this.status = status;
  }

  static badRequest(mensaje) {
    return new AppError(400, mensaje);
  }

  static notFound(mensaje) {
    return new AppError(404, mensaje);
  }

  static conflict(mensaje) {
    return new AppError(409, mensaje);
  }
}

module.exports = AppError;
