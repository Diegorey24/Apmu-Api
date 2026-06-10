const { Router } = require('express');
const afiliadosController = require('../controllers/afiliados');

const router = Router();


router.get('/afiliado',      afiliadosController.getAll);
router.get('/afiliados/search', afiliadosController.search);
router.get('/afiliado/:id',  afiliadosController.getOne);
router.post('/afiliado',     afiliadosController.create);
router.put('/afiliado/:id',  afiliadosController.update);
router.delete('/afiliado/:id', afiliadosController.remove);

module.exports = router;
