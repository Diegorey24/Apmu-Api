const { Router } = require('express');
const controller = require('../controllers/prestamos');
const router = Router();

router.get('/prestamos', controller.getAll);
router.get('/prestamos/:id', controller.getById);
router.post('/prestamos', controller.create);
router.patch('/prestamos/linea/:idLinea/devolver', controller.devolver);

module.exports = router;