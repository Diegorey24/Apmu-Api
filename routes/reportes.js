const { Router } = require('express');
const controller = require('../controllers/reportes');
const router = Router();

router.get('/reportes/deuda/:idAfiliado', controller.getDeudaAfiliado);
router.get('/reportes/conciliacion', controller.getConciliacion);
router.get('/reportes/exportar/afiliados', controller.exportarAfiliados);
router.get('/reportes/exportar/bajas', controller.exportarBajas);
router.get('/reportes/exportar/aportes', controller.exportarAportes);
router.get('/reportes/exportar/prestamos', controller.exportarPrestamos);
router.get('/reportes/exportar/licencias', controller.exportarLicencias);
router.get('/reportes/deudores-libros', controller.getDeudoresLibros);
router.get('/reportes/exportar/deudores-libros', controller.exportarDeudoresLibros);
router.get('/reportes/exportar/libros', controller.exportarListadoLibros);

module.exports = router;