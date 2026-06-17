const model = require('../models/usuariosWeb');

const getAll = async (req, res) => {
  try {
    const data = await model.getAll();
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario?.trim()) return res.status(400).send({ error: true, message: 'El nombre de usuario es obligatorio' });
    if (!password || password.length < 4) return res.status(400).send({ error: true, message: 'La contraseña debe tener al menos 4 caracteres' });
    if (password.length > 15) return res.status(400).send({ error: true, message: 'La contraseña no puede superar 15 caracteres' });
    const data = await model.create(usuario.trim(), password);
    res.status(201).send({ error: false, data });
  } catch (err) {
    res.status(400).send({ error: true, message: err.message });
  }
};

const toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    if (active === undefined) return res.status(400).send({ error: true, message: 'Falta el campo active' });
    await model.toggleActive(id, active ? 1 : 0);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 4) return res.status(400).send({ error: true, message: 'La contraseña debe tener al menos 4 caracteres' });
    if (password.length > 15) return res.status(400).send({ error: true, message: 'La contraseña no puede superar 15 caracteres' });
    await model.cambiarPassword(id, password);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, create, toggleActive, cambiarPassword };
