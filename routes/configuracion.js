const { Router } = require('express');
const controller = require('../controllers/configuracion');
const router = Router();

router.get('/configuracion', controller.getAll);
router.put('/configuracion/:clave', controller.update);

module.exports = router;
