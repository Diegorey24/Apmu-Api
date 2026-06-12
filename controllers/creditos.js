const model = require('../models/creditos');

const getAll = async (req, res) => {
  try {
    const { estado, clienteId, busqueda, page, limit } = req.query;
    const result = await model.getAll({ estado, clienteId, busqueda, page, limit });
    res.status(200).send({ error: false, ...result });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await model.getById(req.params.id);
    if (!data) return res.status(404).send({ error: true, message: 'Crédito no encontrado' });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, getById };