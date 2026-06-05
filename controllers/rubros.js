const rubrosModel = require('../models/rubros');

const getAll = async function (req, res) {
  try {
    const data = await rubrosModel.getAll();
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getOne = async function (req, res) {
  try {
    const data = await rubrosModel.getById(parseInt(req.params.id));
    if (!data) return res.status(404).send({ error: true, message: 'Rubro no encontrado' });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const create = async function (req, res) {
  try {
    const { RubCod, RubDsc } = req.body;
    if (!RubCod || !RubDsc) {
      return res.status(400).send({ error: true, message: 'RubCod y RubDsc son requeridos' });
    }
    const id = await rubrosModel.create(req.body);
    res.status(201).send({ error: false, message: 'Rubro creado', data: { RubCod: id } });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const update = async function (req, res) {
  try {
    const { RubDsc } = req.body;
    if (!RubDsc) {
      return res.status(400).send({ error: true, message: 'RubDsc es requerido' });
    }
    const rows = await rubrosModel.update(parseInt(req.params.id), req.body);
    if (!rows) return res.status(404).send({ error: true, message: 'Rubro no encontrado' });
    res.status(200).send({ error: false, message: 'Rubro actualizado' });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const remove = async function (req, res) {
  try {
    const rows = await rubrosModel.remove(parseInt(req.params.id));
    if (!rows) return res.status(404).send({ error: true, message: 'Rubro no encontrado' });
    res.status(200).send({ error: false, message: 'Rubro eliminado' });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };