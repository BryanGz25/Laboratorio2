const cuponesService = require('../services/cupones.service');

function listar(req, res, next) {
  try {
    res.status(200).json(cuponesService.listar());
  } catch (err) {
    next(err);
  }
}

function obtenerPorCodigo(req, res, next) {
  try {
    res.status(200).json(cuponesService.obtenerPorCodigo(req.params.codigo));
  } catch (err) {
    next(err);
  }
}

function crear(req, res, next) {
  try {
    res.status(201).json(cuponesService.crear(req.body));
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtenerPorCodigo, crear };
