const { Router } = require('express');
const controller = require('../controllers/tarjetas-macro');
const router = Router();

router.get('/tarjetas-macro', controller.getAll);
router.post('/tarjetas-macro', controller.create);
router.patch('/tarjetas-macro/:id/estado', controller.cambiarEstado);
router.delete('/tarjetas-macro/:id', controller.remove);

module.exports = router;
