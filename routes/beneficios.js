const { Router } = require('express');
const controller = require('../controllers/beneficios');
const router = Router();

router.get('/beneficios', controller.getAll);
router.get('/beneficios/listado/canastas', controller.getListadoCanastas);
router.get('/beneficios/listado/utiles', controller.getListadoUtiles);
router.post('/beneficios', controller.create);
router.delete('/beneficios/:id', controller.remove);

module.exports = router;