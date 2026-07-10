const { Router } = require('express');
const controller = require('../controllers/licenciasgremiales');
const router = Router();

router.get('/licencias-gremiales', controller.getAll);
router.post('/licencias-gremiales', controller.create);
router.put('/licencias-gremiales/:id', controller.update);
router.delete('/licencias-gremiales/:id', controller.remove);

module.exports = router;