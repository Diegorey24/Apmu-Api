const { Router } = require('express');
const controller = require('../controllers/centroscosto');
const router = Router();

router.get('/centros-costo', controller.getAll);
router.post('/centros-costo', controller.create);
router.put('/centros-costo/:id', controller.update);
router.delete('/centros-costo/:id', controller.remove);

module.exports = router;
