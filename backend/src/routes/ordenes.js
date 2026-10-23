const { Router } = require('express');
const controller = require('../controllers/ordenes.controller');

const router = Router();

router.get('/', controller.listar);          // ?estado=pagada&cliente_id=1
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.patch('/:id/estado', controller.cambiarEstado);

module.exports = router;
