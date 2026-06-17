const { Router } = require('express');
const dashboardController = require('../controllers/dashboard');

const router = Router();

router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/proximos-vencer', dashboardController.getProximosVencer);
router.get('/dashboard/recaudacion-mensual', dashboardController.getRecaudacionMensual);
router.get('/dashboard/prestamos-por-estado', dashboardController.getPrestamosPorEstado);
router.get('/dashboard/libros-mas-prestados', dashboardController.getLibrosMasPrestados);

module.exports = router;