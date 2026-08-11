const { Router } = require('express');
const authController = require('../controllers/auth');

const router = Router();

router.post('/authenticate', authController.login);

module.exports = router;
