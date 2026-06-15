const model = require('../models/libros');

const getAll = async (req, res) => {
  try {
    const { tipo, idMateria, busqueda, stockBajo } = req.query;
    const data = await model.getAll({ tipo, idMateria, busqueda, stockBajo: stockBajo === '1' || stockBajo === 'true' });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await model.getById(req.params.id);
    if (!data) return res.status(404).send({ error: true, message: 'Libro no encontrado' });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    if (!nombre?.trim()) return res.status(400).send({ error: true, message: 'El nombre es obligatorio' });
    if (!tipo) return res.status(400).send({ error: true, message: 'El tipo es obligatorio' });
    const id = await model.create(req.body);
    res.status(201).send({ error: false, data: { id } });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    if (!nombre?.trim()) return res.status(400).send({ error: true, message: 'El nombre es obligatorio' });
    if (!tipo) return res.status(400).send({ error: true, message: 'El tipo es obligatorio' });
    await model.update(req.params.id, req.body);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const baja = async (req, res) => {
  try {
    await model.baja(req.params.id);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const alta = async (req, res) => {
  try {
    await model.alta(req.params.id);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, getById, create, update, baja, alta };