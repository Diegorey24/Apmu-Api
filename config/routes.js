const express = require('express');
const router = express.Router();

/* Routes includes */
const root      = require('../routes/root');
const afiliados = require('../routes/afiliados');
const autores   = require('../routes/autores');
const rubros    = require('../routes/rubros');
const cuentaCorriente = require('../routes/cuentacorriente');
const dashboard = require('../routes/dashboard');
const editoriales = require('../routes/editoriales');
const materias = require('../routes/materias');
const libros = require('../routes/libros');

/* End Routes includes */

router.use('/', root);
router.use('/', afiliados);
router.use('/', autores);
router.use('/', rubros); 
router.use('/', cuentaCorriente);
router.use('/', dashboard);
router.use('/', editoriales);
router.use('/', materias);
router.use('/', libros);

// catch 404
router.use(function (req, res) {
  const method = req.method;
  const url = req.url;
  console.log(method + ' ' + url + ' StatusCode 404');
  res.status(404).send({ message: 'Error 404' });
});

module.exports = router;
