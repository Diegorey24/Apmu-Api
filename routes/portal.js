const { Router } = require('express');
const controller = require('../controllers/portal');
const router = Router();

router.post('/portal/registrar', controller.registrar);
router.post('/portal/login', controller.login);
router.get('/portal/mis-datos', controller.getMisDatos);
router.get('/portal/pendientes', controller.getPendientes);
router.patch('/portal/:id/aprobar', controller.aprobar);
router.patch('/portal/:id/rechazar', controller.rechazar);

module.exports = router;