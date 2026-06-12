const { Router } = require('express');
const controller = require('../controllers/creditos');
const router = Router();

router.get('/creditos', controller.getAll);
router.get('/creditos/:id', controller.getById);

module.exports = router;