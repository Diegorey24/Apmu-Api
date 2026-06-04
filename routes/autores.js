const { Router } = require('express');
const autoresController = require('../controllers/autores');

const router = Router();

router.get('/autor',       autoresController.getAll);
router.get('/autor/:id',   autoresController.getOne);
router.post('/autor',      autoresController.create);
router.put('/autor/:id',   autoresController.update);
router.delete('/autor/:id', autoresController.remove);

module.exports = router;
