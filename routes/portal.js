const { Router } = require('express');
const controller = require('../controllers/portal');
const router = Router();

router.post('/portal/registrar', controller.registrar);
router.post('/portal/login', controller.login);
router.get('/portal/mis-datos', controller.getMisDatos);
router.get('/portal/pendientes', controller.getPendientes);
router.patch('/portal/:id/aprobar', controller.aprobar);
router.patch('/portal/:id/rechazar', controller.rechazar);
router.patch('/portal/cambiar-password', controller.cambiarPassword);
router.patch('/portal/contacto', controller.actualizarContacto);
router.get('/portal/mis-hijos', controller.getMisHijos);
router.post('/portal/solicitar-libro', controller.solicitarLibro);
router.get('/portal/mis-solicitudes', controller.getMisSolicitudes);
router.patch('/portal/:id/reset-password', controller.resetPassword);
router.delete('/portal/:id', controller.eliminarSolicitud);

module.exports = router;