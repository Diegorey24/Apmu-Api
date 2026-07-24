const { Router } = require('express');
const controller = require('../controllers/plancuentas');
const router = Router();

router.get('/plan-cuentas', controller.getAll);

module.exports = router;
