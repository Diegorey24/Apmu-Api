const model = require('../models/configuracion');

const getAll = async (req, res) => {
  try {
    const data = await model.getAll();
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { valor } = req.body;
    if (valor === undefined || valor === null || valor === '') {
      return res.status(400).send({ error: true, message: 'El valor es obligatorio' });
    }
    const rows = await model.update(req.params.clave, valor);
    if (!rows) return res.status(404).send({ error: true, message: 'Clave no encontrada' });
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, update };
