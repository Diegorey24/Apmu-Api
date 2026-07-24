const { Router } = require('express');
const controller = require('../controllers/prestamos-articulos');
const router = Router();

router.get('/prestamos-articulos', controller.getAll);
router.get('/prestamos-articulos/:id/pdf', controller.generarPDF);
router.post('/prestamos-articulos', controller.create);
router.put('/prestamos-articulos/:id', controller.update);
router.patch('/prestamos-articulos/:id/devolver', controller.devolver);
router.delete('/prestamos-articulos/:id', controller.remove);

module.exports = router;
