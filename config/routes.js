const express = require('express');
const router = express.Router();

/* Routes includes */
const root = require('../routes/root');
const afiliados = require('../routes/afiliados');
const autores = require('../routes/autores');
const rubros = require('../routes/rubros');
const cuentaCorriente = require('../routes/cuentacorriente');
const dashboard = require('../routes/dashboard');
const editoriales = require('../routes/editoriales');
const materias = require('../routes/materias');
const libros = require('../routes/libros');
const prestamos = require('../routes/prestamos');
const reportes = require('../routes/reportes');
const creditos = require('../routes/creditos');
const cajachica = require('../routes/cajachica');
const portal = require('../routes/portal');
const usuariosWeb = require('../routes/usuariosWeb');
const categorias = require('../routes/categorias');
const ubicaciones = require('../routes/ubicaciones');
const motivosbaja = require('../routes/motivosbaja');
const hijos = require('../routes/hijos');
const solicitudesAfiliacion = require('../routes/solicitudesafiliacion');
const importacionaportes = require('../routes/importacionaportes');
const licenciasgremiales = require('../routes/licenciasgremiales');
const beneficios = require('../routes/beneficios');
const solicitudesprestamo = require('../routes/solicitudesprestamo');

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
router.use('/', prestamos);
router.use('/', reportes);
router.use('/', creditos);
router.use('/', cajachica);
router.use('/', portal);
router.use('/', usuariosWeb);
router.use('/', categorias);
router.use('/', ubicaciones);
router.use('/', motivosbaja);
router.use('/', hijos);
router.use('/', solicitudesAfiliacion);
router.use('/', importacionaportes);
router.use('/', licenciasgremiales);
router.use('/', beneficios);
router.use('/', solicitudesprestamo);


// catch 404
router.use(function (req, res) {
  const method = req.method;
  const url = req.url;
  console.log(method + ' ' + url + ' StatusCode 404');
  res.status(404).send({ message: 'Error 404' });
});

module.exports = router;
