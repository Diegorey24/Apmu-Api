const { Router } = require('express');
const controller = require('../controllers/solicitudesprestamo');
const router = Router();

router.get('/solicitudes-prestamo', controller.getAll);
router.patch('/solicitudes-prestamo/:id/aprobar', controller.aprobar);
router.patch('/solicitudes-prestamo/:id/rechazar', controller.rechazar);

module.exports = router;