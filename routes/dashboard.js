const { Router } = require('express');
const dashboardController = require('../controllers/dashboard');

const router = Router();

router.get('/dashboard/stats', dashboardController.getStats);
router.get('/dashboard/proximos-vencer', dashboardController.getProximosVencer);

module.exports = router;