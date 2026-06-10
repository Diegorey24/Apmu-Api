const model = require('../models/prestamos');

const getAll = async (req, res) => {
  try {
    const { estado, idAfiliado } = req.query;
    const data = await model.getAll({ estado, idAfiliado });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await model.getById(req.params.id);
    if (!data) return res.status(404).send({ error: true, message: 'Préstamo no encontrado' });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { idAfiliado, lineas } = req.body;
    if (!idAfiliado) return res.status(400).send({ error: true, message: 'El afiliado es obligatorio' });
    if (!lineas || lineas.length === 0) return res.status(400).send({ error: true, message: 'Debe incluir al menos un libro' });
    const id = await model.create(idAfiliado, lineas);
    res.status(201).send({ error: false, data: { id } });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const devolver = async (req, res) => {
  try {
    await model.devolver(req.params.idLinea);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, getById, create, devolver };