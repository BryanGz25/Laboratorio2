const productosService = require('../services/productos.service');

function listar(req, res, next) {
  try {
    res.status(200).json(productosService.listar(req.query));
  } catch (err) {
    next(err);
  }
}

function obtener(req, res, next) {
  try {
    res.status(200).json(productosService.obtener(req.params.id));
  } catch (err) {
    next(err);
  }
}

function crear(req, res, next) {
  try {
    res.status(201).json(productosService.crear(req.body));
  } catch (err) {
    next(err);
  }
}

function actualizar(req, res, next) {
  try {
    res.status(200).json(productosService.actualizar(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

function eliminar(req, res, next) {
  try {
    productosService.eliminar(req.params.id);
    res.status(200).json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
