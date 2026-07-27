const { Router } = require('express');
const controller = require('../controllers/plancuentas');
const router = Router();

router.get('/plan-cuentas', controller.getAll);
router.post('/plan-cuentas', controller.create);
router.put('/plan-cuentas/:codigo', controller.update);
router.delete('/plan-cuentas/:codigo', controller.remove);

module.exports = router;
