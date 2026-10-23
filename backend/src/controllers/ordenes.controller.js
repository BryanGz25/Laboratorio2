const ordenesService = require('../services/ordenes.service');

function listar(req, res, next) {
  try {
    res.status(200).json(ordenesService.listar(req.query));
  } catch (err) {
    next(err);
  }
}

function obtener(req, res, next) {
  try {
    res.status(200).json(ordenesService.obtener(req.params.id));
  } catch (err) {
    next(err);
  }
}

function crear(req, res, next) {
  try {
    res.status(201).json(ordenesService.crear(req.body));
  } catch (err) {
    next(err);
  }
}

function cambiarEstado(req, res, next) {
  try {
    res.status(200).json(ordenesService.cambiarEstado(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, cambiarEstado };
