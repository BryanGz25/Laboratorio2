const clientesService = require('../services/clientes.service');

function listar(req, res, next) {
  try {
    res.status(200).json(clientesService.listar());
  } catch (err) {
    next(err);
  }
}

module.exports = { listar };
