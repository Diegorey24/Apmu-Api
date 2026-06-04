const { Router } = require('express');
const usersController = require('../controllers/users');

const router = Router();

router.post('/authenticate', usersController.authenticate);

module.exports = router;
