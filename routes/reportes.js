const { Router } = require('express');
const controller = require('../controllers/reportes');
const router = Router();

router.get('/reportes/deuda/:idAfiliado', controller.getDeudaAfiliado);
router.get('/reportes/conciliacion', controller.getConciliacion);

module.exports = router;