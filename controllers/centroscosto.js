const model = require('../models/centroscosto');

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
    const { codigo, nombre } = req.body;
    if (!codigo?.trim()) return res.status(400).send({ error: true, message: 'El código es obligatorio' });
    if (!nombre?.trim()) return res.status(400).send({ error: true, message: 'El nombre es obligatorio' });

    const id = await model.create(codigo.trim(), nombre.trim());
    res.status(201).send({ error: false, data: { id } });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { codigo, nombre } = req.body;
    if (!codigo?.trim()) return res.status(400).send({ error: true, message: 'El código es obligatorio' });
    if (!nombre?.trim()) return res.status(400).send({ error: true, message: 'El nombre es obligatorio' });

    const existente = await model.getById(req.params.id);
    if (!existente) return res.status(404).send({ error: true, message: 'Centro de costo no encontrado' });

    await model.update(req.params.id, codigo.trim(), nombre.trim());
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await model.remove(req.params.id);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, create, update, remove };
