const { Router } = require('express');
const afiliadosController = require('../controllers/afiliados');
const requireRole = require('../middlewares/requireRole');

const router = Router();

const soloAdmin = requireRole('Administrador');

router.get('/afiliado', afiliadosController.getAll);
router.get('/afiliados/search', afiliadosController.search);
router.get('/afiliado/:id', afiliadosController.getOne);
router.post('/afiliado', soloAdmin, afiliadosController.create);
router.put('/afiliado/:id', soloAdmin, afiliadosController.update);
router.delete('/afiliado/:id', soloAdmin, afiliadosController.remove);
router.patch('/afiliados/:id/reactivar', soloAdmin, afiliadosController.reactivar);


module.exports = router;
