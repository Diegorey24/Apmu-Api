const { Router } = require('express');
const dashboardController = require('../controllers/dashboard');

const router = Router();

router.get('/dashboard/stats', dashboardController.getStats);

module.exports = router;