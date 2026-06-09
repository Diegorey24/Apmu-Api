const { Router } = require('express');
const controller = require('../controllers/editoriales');
const router = Router();

router.get('/editoriales', controller.getAll);
router.post('/editoriales', controller.create);
router.put('/editoriales/:id', controller.update);
router.delete('/editoriales/:id', controller.remove);

module.exports = router;