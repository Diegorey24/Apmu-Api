const { Router } = require('express');
const controller = require('../controllers/hijos');
const requireRole = require('../middlewares/requireRole');
const router = Router();

const soloAdmin = requireRole('Administrador');

router.get('/hijos/:idAfiliado', controller.getByAfiliado);
router.post('/hijos', soloAdmin, controller.create);
router.put('/hijos/:id', soloAdmin, controller.update);
router.patch('/hijos/:id/validar', soloAdmin, controller.validar);
router.patch('/hijos/:id/titular', soloAdmin, controller.cambiarTitular);
router.delete('/hijos/:id', soloAdmin, controller.remove);

module.exports = router;