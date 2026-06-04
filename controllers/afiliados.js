const afiliadosModel = require('../models/afiliados');

const getAll = async function (req, res) {
  try {
    const page   = parseInt(req.query.page)   || 1;
    const limit  = parseInt(req.query.limit)  || 20;
    const search = req.query.search || '';
    const result = await afiliadosModel.getAll({ page, limit, search });
    res.status(200).send({ error: false, ...result });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getOne = async function (req, res) {
  try {
    const data = await afiliadosModel.getById(parseInt(req.params.id));
    if (!data) return res.status(404).send({ error: true, message: 'Afiliado no encontrado' });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const create = async function (req, res) {
  try {
    console.log('Entro aca');
    const { Documento, PrimerNombre, PrimerApellido } = req.body;
    if (!Documento || !PrimerNombre || !PrimerApellido) {
      return res.status(400).send({ error: true, message: 'Documento, PrimerNombre y PrimerApellido son requeridos' });
    }
    const id = await afiliadosModel.create(req.body);
    res.status(201).send({ error: false, message: 'Afiliado creado', data: { Id: id } });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const update = async function (req, res) {
  try {
    const { Documento, PrimerNombre, PrimerApellido } = req.body;
    if (!Documento || !PrimerNombre || !PrimerApellido) {
      return res.status(400).send({ error: true, message: 'Documento, PrimerNombre y PrimerApellido son requeridos' });
    }
    const rows = await afiliadosModel.update(parseInt(req.params.id), req.body);
    if (!rows) return res.status(404).send({ error: true, message: 'Afiliado no encontrado' });
    res.status(200).send({ error: false, message: 'Afiliado actualizado' });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const remove = async function (req, res) {
  try {
    const rows = await afiliadosModel.remove(parseInt(req.params.id));
    if (!rows) return res.status(404).send({ error: true, message: 'Afiliado no encontrado' });
    res.status(200).send({ error: false, message: 'Afiliado dado de baja' });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
