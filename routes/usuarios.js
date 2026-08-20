const { Router } = require('express');
const controller = require('../controllers/usuarios');
const router = Router();

// Protegida por el middleware global de authenticateToken (JWT interno, ver main.js).
router.put('/usuarios/cambiar-password', controller.cambiarPassword);

module.exports = router;
