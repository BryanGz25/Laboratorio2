const metricsService = require('../services/metrics.service');

function resumen(req, res, next) {
  try {
    res.status(200).json(metricsService.resumen());
  } catch (err) {
    next(err);
  }
}

module.exports = { resumen };
