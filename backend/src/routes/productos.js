const { Router } = require('express');
const controller = require('../controllers/productos.controller');

const router = Router();

router.get('/', controller.listar);          // ?categoria=Hogar
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;
