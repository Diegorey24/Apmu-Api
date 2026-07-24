const { Router } = require('express');
const controller = require('../controllers/centroscosto');
const router = Router();

router.get('/centros-costo', controller.getAll);

module.exports = router;
