const { Router } = require('express');
const controller = require('../controllers/importacionaportes');
const multer = require('multer');
const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/importacion-aportes', upload.single('archivo'), controller.importar);

module.exports = router;