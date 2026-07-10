const { Router } = require('express');
const controller = require('../controllers/solicitudesafiliacion');
const router = Router();

router.get('/solicitudes-afiliacion', controller.getAll);
router.post('/solicitudes-afiliacion', controller.create);
router.patch('/solicitudes-afiliacion/:id/aprobar', controller.aprobar);
router.patch('/solicitudes-afiliacion/:id/rechazar', controller.rechazar);

module.exports = router;