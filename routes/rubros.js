const { Router } = require('express');
const rubrosController = require('../controllers/rubros');

const router = Router();

router.get('/rubro',       rubrosController.getAll);
router.get('/rubro/:id',   rubrosController.getOne);
router.post('/rubro',      rubrosController.create);
router.put('/rubro/:id',   rubrosController.update);
router.delete('/rubro/:id', rubrosController.remove);

module.exports = router;