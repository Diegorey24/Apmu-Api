const { Router } = require('express');
const controller = require('../controllers/hijos');
const router = Router();

router.get('/hijos/:idAfiliado', controller.getByAfiliado);
router.post('/hijos', controller.create);
router.put('/hijos/:id', controller.update);
router.patch('/hijos/:id/validar', controller.validar);
router.patch('/hijos/:id/titular', controller.cambiarTitular);
router.delete('/hijos/:id', controller.remove);

module.exports = router;