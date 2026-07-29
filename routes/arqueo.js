const { Router } = require('express');
const controller = require('../controllers/arqueo');
const router = Router();

router.get('/arqueos', controller.getAll);
router.post('/arqueos', controller.create);
router.delete('/arqueos/:id', controller.remove);

module.exports = router;
