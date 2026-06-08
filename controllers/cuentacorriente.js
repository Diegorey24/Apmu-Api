const ccModel = require('../models/cuentacorriente');

const getAll = async function (req, res) {
  try {
    const page       = parseInt(req.query.page)       || 1;
    const limit      = parseInt(req.query.limit)      || 20;
    const idAfiliado = req.query.idAfiliado ? parseInt(req.query.idAfiliado) : null;
    const aniomes    = req.query.aniomes    ? parseInt(req.query.aniomes)    : null;
    const estado     = req.query.estado    || null;
    const result = await ccModel.getAll({ page, limit, idAfiliado, aniomes, estado });
    res.status(200).send({ error: false, ...result });
  } catch (err) {
    console.log('ERROR cuenta corriente:', err.message); 
    res.status(500).send({ error: true, message: err.message });
  }
};

const getOne = async function (req, res) {
  try {
    const data = await ccModel.getById(parseInt(req.params.id));
    if (!data) return res.status(404).send({ error: true, message: 'Movimiento no encontrado' });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const create = async function (req, res) {
  try {
    const { IdAfiliado, Rubro, Aniomes } = req.body;
    if (!IdAfiliado || !Rubro || !Aniomes) {
      return res.status(400).send({ error: true, message: 'IdAfiliado, Rubro y Aniomes son requeridos' });
    }
    const id = await ccModel.create(req.body);
    res.status(201).send({ error: false, message: 'Cargo creado', data: { Id: id } });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const update = async function (req, res) {
  try {
    const { IdAfiliado, Rubro, Aniomes } = req.body;
    if (!IdAfiliado || !Rubro || !Aniomes) {
      return res.status(400).send({ error: true, message: 'IdAfiliado, Rubro y Aniomes son requeridos' });
    }
    const rows = await ccModel.update(parseInt(req.params.id), req.body);
    if (!rows) return res.status(404).send({ error: true, message: 'Movimiento no encontrado o ya fue cobrado' });
    res.status(200).send({ error: false, message: 'Cargo actualizado' });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const cobrar = async function (req, res) {
  try {
    const { NroRecibo, FechaPago, FormaPago } = req.body;
    if (!NroRecibo || !FechaPago || !FormaPago) {
      return res.status(400).send({ error: true, message: 'NroRecibo, FechaPago y FormaPago son requeridos' });
    }
    const rows = await ccModel.cobrar(parseInt(req.params.id), req.body);
    if (!rows) return res.status(404).send({ error: true, message: 'Movimiento no encontrado o ya fue cobrado' });
    res.status(200).send({ error: false, message: 'Pago registrado' });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const remove = async function (req, res) {
  try {
    const rows = await ccModel.remove(parseInt(req.params.id));
    if (!rows) return res.status(404).send({ error: true, message: 'Movimiento no encontrado o ya fue cobrado' });
    res.status(200).send({ error: false, message: 'Cargo eliminado' });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, cobrar, remove };