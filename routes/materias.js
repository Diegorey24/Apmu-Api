const { Router } = require('express');
const controller = require('../controllers/materias');
const router = Router();

router.get('/materias', controller.getAll);
router.post('/materias', controller.create);
router.put('/materias/:id', controller.update);
router.delete('/materias/:id', controller.remove);

module.exports = router;