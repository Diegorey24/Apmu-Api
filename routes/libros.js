const { Router } = require('express');
const controller = require('../controllers/libros');
const router = Router();

router.get('/libros', controller.getAll);
router.get('/libros/:id', controller.getById);
router.post('/libros', controller.create);
router.put('/libros/:id', controller.update);
router.patch('/libros/:id/baja', controller.baja);
router.patch('/libros/:id/alta', controller.alta);

module.exports = router;