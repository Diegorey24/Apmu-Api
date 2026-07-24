const { Router } = require('express');
const controller = require('../controllers/banco');
const router = Router();

router.get('/banco', controller.getAll);
router.post('/banco', controller.create);
router.put('/banco/:id', controller.update);
router.delete('/banco/:id', controller.remove);

module.exports = router;
