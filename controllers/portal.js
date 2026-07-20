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

const actualizarContacto = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send({ error: true, message: 'Sin autorización' });
    const decoded = jwt.verify(token, SECRET_PORTAL);
    if (!decoded.idAfiliado) return res.status(403).send({ error: true, message: 'Afiliado no vinculado' });

    const { mail, celular, telefono, domicilio } = req.body;
    const pool = await require('../helpers/db').getConnection();
    await pool.request()
      .input('id', decoded.idAfiliado)
      .input('mail', mail || null)
      .input('celular', celular || null)
      .input('telefono', telefono || null)
      .input('domicilio', domicilio || null)
      .query(`
        UPDATE Afiliados SET
          Mail = @mail, Celular = @celular,
          Telefono = @telefono, Domicilio = @domicilio,
          FechaUltimaModificacion = GETDATE()
        WHERE Id = @id
      `);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(401).send({ error: true, message: 'Token inválido' });
  }
};

const getMisHijos = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send({ error: true, message: 'Sin autorización' });
    const decoded = jwt.verify(token, SECRET_PORTAL);
    if (!decoded.idAfiliado) return res.status(403).send({ error: true, message: 'Afiliado no vinculado' });

    const pool = await require('../helpers/db').getConnection();
    const rs = await pool.request()
      .input('id', decoded.idAfiliado)
      .query(`
        SELECT Id, PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido,
          Documento, FechaNacimiento, Validado
        FROM Hijos WHERE IdAfiliado = @id
        ORDER BY PrimerApellido, PrimerNombre
      `);
    res.status(200).send({ error: false, data: rs.recordset });
  } catch (err) {
    res.status(401).send({ error: true, message: 'Token inválido' });
  }
};

const solicitarLibro = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send({ error: true, message: 'Sin autorización' });
    const decoded = jwt.verify(token, SECRET_PORTAL);
    if (!decoded.idAfiliado) return res.status(403).send({ error: true, message: 'Afiliado no vinculado' });

    const { idLibro } = req.body;
    if (!idLibro) return res.status(400).send({ error: true, message: 'El libro es obligatorio' });

    const model = require('../models/solicitudesprestamo');
    const id = await model.create(decoded.idAfiliado, idLibro);
    res.status(201).send({ error: false, data: { id } });
  } catch (err) {
    res.status(400).send({ error: true, message: err.message });
  }
};

const getMisSolicitudes = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send({ error: true, message: 'Sin autorización' });
    const decoded = jwt.verify(token, SECRET_PORTAL);
    if (!decoded.idAfiliado) return res.status(403).send({ error: true, message: 'Afiliado no vinculado' });

    const model = require('../models/solicitudesprestamo');
    const data = await model.getByAfiliado(decoded.idAfiliado);
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(401).send({ error: true, message: 'Token inválido' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).send({ error: true, message: 'La contraseña debe tener al menos 6 caracteres' });
    await model.resetPassword(req.params.id, password);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const eliminarSolicitud = async (req, res) => {
  try {
    await model.eliminar(req.params.id);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const crearDesdeAdmin = async (req, res) => {
  try {
    const { documento, password } = req.body;
    if (!documento?.trim()) return res.status(400).send({ error: true, message: 'El documento es obligatorio' });
    if (!password || password.length < 6) return res.status(400).send({ error: true, message: 'La contraseña debe tener al menos 6 caracteres' });
    const id = await model.crearDesdeAdmin(documento.trim(), password);
    res.status(201).send({ error: false, data: { id } });
  } catch (err) {
    res.status(400).send({ error: true, message: err.message });
  }
};

const getAllUsuarios = async (req, res) => {
  try {
    const data = await model.getAll();
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { registrar, login, getPendientes, aprobar, rechazar, getMisDatos, cambiarPassword, actualizarContacto, getMisHijos, solicitarLibro, getMisSolicitudes, resetPassword, eliminarSolicitud, crearDesdeAdmin, getAllUsuarios };