const { Router } = require('express');
const controller = require('../controllers/beneficios');
const router = Router();

router.get('/beneficios', controller.getAll);
router.post('/beneficios', controller.create);
router.delete('/beneficios/:id', controller.remove);

module.exports = router;