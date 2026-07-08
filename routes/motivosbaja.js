const { Router } = require('express');
const controller = require('../controllers/motivosbaja');
const router = Router();
router.get('/motivosbaja', controller.getAll);
module.exports = router;