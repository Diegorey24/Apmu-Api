const { Router } = require('express');
const controller = require('../controllers/cajachica');
const router = Router();

router.get('/cajachica', controller.getAll);
router.post('/cajachica', controller.create);
router.put('/cajachica/:id', controller.update);
router.delete('/cajachica/:id', controller.remove);

module.exports = router;