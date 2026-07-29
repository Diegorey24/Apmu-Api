const model = require('../models/arqueo');

const getAll = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const data = await model.getAll({ fechaDesde, fechaHasta });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    if (!req.body.fecha) return res.status(400).send({ error: true, message: 'La fecha es obligatoria' });

    const resultado = await model.create(req.body);
    res.status(201).send({ error: false, data: resultado });
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

module.exports = { getAll, create, remove };
