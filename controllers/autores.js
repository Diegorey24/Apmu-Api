const autoresModel = require('../models/autores');

const getAll = async function (req, res) {
  try {
    const data = await autoresModel.getAll();
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getOne = async function (req, res) {
  try {
    const data = await autoresModel.getById(req.params.id);
    if (!data) return res.status(404).send({ error: true, message: 'Autor no encontrado' });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const create = async function (req, res) {
  try {
    const { ID, Autor } = req.body;
    if (!ID) return res.status(400).send({ error: true, message: 'ID es requerido' });
    await autoresModel.create({ ID, Autor });
    res.status(201).send({ error: false, message: 'Autor creado' });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const update = async function (req, res) {
  try {
    const rows = await autoresModel.update(req.params.id, req.body);
    if (!rows) return res.status(404).send({ error: true, message: 'Autor no encontrado' });
    res.status(200).send({ error: false, message: 'Autor actualizado' });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const remove = async function (req, res) {
  try {
    const rows = await autoresModel.remove(req.params.id);
    if (!rows) return res.status(404).send({ error: true, message: 'Autor no encontrado' });
    res.status(200).send({ error: false, message: 'Autor eliminado' });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
