const { Router } = require('express');
const controller = require('../controllers/cupones.controller');

const router = Router();

router.get('/', controller.listar);
router.get('/:codigo', controller.obtenerPorCodigo);
router.post('/', controller.crear);

module.exports = router;
