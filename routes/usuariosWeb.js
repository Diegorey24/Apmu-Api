const { Router } = require('express');
const controller = require('../controllers/usuariosWeb');
const router = Router();

router.get('/usuarios-web', controller.getAll);
router.post('/usuarios-web', controller.create);
router.patch('/usuarios-web/:id/toggle-active', controller.toggleActive);
router.patch('/usuarios-web/:id/password', controller.cambiarPassword);

module.exports = router;
