const { Router } = require('express');
const ccController = require('../controllers/cuentacorriente');

const router = Router();

router.get('/cuenta-corriente',          ccController.getAll);
router.get('/cuenta-corriente/:id',      ccController.getOne);
router.post('/cuenta-corriente',         ccController.create);
router.put('/cuenta-corriente/:id',      ccController.update);
router.patch('/cuenta-corriente/:id/cobrar', ccController.cobrar);
router.delete('/cuenta-corriente/:id',   ccController.remove);

module.exports = router;