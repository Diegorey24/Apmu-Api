const model = require('../models/portal');
const jwt = require('jsonwebtoken');

const SECRET_PORTAL = 'portal_apmu_secret_2026';

const registrar = async (req, res) => {
  try {
    const { documento, email, password } = req.body;
    if (!documento?.trim()) return res.status(400).send({ error: true, message: 'El documento es obligatorio' });
    if (!password || password.length < 6) return res.status(400).send({ error: true, message: 'La contraseña debe tener al menos 6 caracteres' });
    const result = await model.registrar(documento.trim(), email, password);
    res.status(201).send({ error: false, data: result });
  } catch (err) {
    res.status(400).send({ error: true, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { documento, password } = req.body;
    if (!documento || !password) return res.status(400).send({ error: true, message: 'Documento y contraseña requeridos' });
    const usuario = await model.login(documento.trim(), password);
    const token = jwt.sign(
      { idAfiliado: usuario.IdAfiliado, documento: usuario.Documento, rol: 'socio' },
      SECRET_PORTAL,
      { expiresIn: '8h' }
    );
    res.status(200).send({
      error: false,
      data: {
        token,
        nombre: `${usuario.PrimerNombre} ${usuario.PrimerApellido}`,
      }
    });
  } catch (err) {
    res.status(401).send({ error: true, message: err.message });
  }
};

const getPendientes = async (req, res) => {
  try {
    const data = await model.getPendientes();
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const aprobar = async (req, res) => {
  try {
    await model.aprobar(req.params.id, 'admin');
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const rechazar = async (req, res) => {
  try {
    await model.rechazar(req.params.id);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getMisDatos = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send({ error: true, message: 'Sin autorización' });
    const decoded = jwt.verify(token, SECRET_PORTAL);
    if (!decoded.idAfiliado) return res.status(403).send({ error: true, message: 'Afiliado no vinculado' });
    const data = await model.getDatosAfiliado(decoded.idAfiliado);
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(401).send({ error: true, message: 'Token inválido' });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send({ error: true, message: 'Sin autorización' });
    const decoded = jwt.verify(token, SECRET_PORTAL);

    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva) return res.status(400).send({ error: true, message: 'Faltan datos' });
    if (passwordNueva.length < 6) return res.status(400).send({ error: true, message: 'La contraseña nueva debe tener al menos 6 caracteres' });
    if (passwordActual === passwordNueva) return res.status(400).send({ error: true, message: 'La nueva contraseña debe ser diferente a la actual' });

    await model.cambiarPassword(decoded.idAfiliado, passwordActual, passwordNueva);
    res.status(200).send({ error: false, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(400).send({ error: true, message: err.message });
  }
};

module.exports = { registrar, login, getPendientes, aprobar, rechazar, getMisDatos, cambiarPassword };