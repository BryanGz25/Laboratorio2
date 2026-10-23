const { Router } = require('express');
const controller = require('../controllers/metrics.controller');

const router = Router();

router.get('/resumen', controller.resumen);

module.exports = router;
