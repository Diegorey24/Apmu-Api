const { Router } = require('express');
const controller = require('../controllers/categorias');
const router = Router();

router.get('/categorias', controller.getAll);
router.post('/categorias', controller.create);
router.put('/categorias/:id', controller.update);
router.delete('/categorias/:id', controller.remove);

module.exports = router;