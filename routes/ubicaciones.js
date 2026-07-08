const { Router } = require('express');
const controller = require('../controllers/ubicaciones');
const router = Router();

router.get('/ubicaciones', controller.getAll);
router.post('/ubicaciones', controller.create);
router.put('/ubicaciones/:id', controller.update);
router.delete('/ubicaciones/:id', controller.remove);

module.exports = router;