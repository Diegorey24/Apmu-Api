const model = require('../models/cajachica');

const getAll = async (req, res) => {
  try {
    const data = await model.getAll();
    const resumen = await model.getResumen();
    res.status(200).send({ error: false, data, resumen });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const validar = (body) => {
  if (!body.fecha) return 'La fecha es obligatoria';
  if (!['Entrada', 'Salida'].includes(body.tipo)) return 'El tipo debe ser Entrada o Salida';
  if (!body.descripcion?.trim()) return 'La descripción es obligatoria';
  if (!body.importe || parseFloat(body.importe) <= 0) return 'El importe debe ser mayor a 0';
  return null;
};

const create = async (req, res) => {
  try {
    const err = validar(req.body);
    if (err) return res.status(400).send({ error: true, message: err });
    const id = await model.create(req.body);
    res.status(201).send({ error: false, data: { id } });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const err = validar(req.body);
    if (err) return res.status(400).send({ error: true, message: err });
    await model.update(req.params.id, req.body);
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