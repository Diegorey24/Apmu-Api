const model = require('../models/banco');

const getAll = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const data = await model.getAll({ fechaDesde, fechaHasta });
    const resumen = await model.getResumen();
    res.status(200).send({ error: false, data, resumen });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const validar = (body) => {
  if (!body.fecha) return 'La fecha es obligatoria';
  if (!body.descripcion?.trim()) return 'La descripción es obligatoria';
  const debe = parseFloat(body.debe) || 0;
  const haber = parseFloat(body.haber) || 0;
  if (debe <= 0 && haber <= 0) return 'Debe ingresar un importe en Debe o en Haber';
  if (debe > 0 && haber > 0) return 'No puede ingresar importe en Debe y en Haber a la vez';
  return null;
};

const efectoDe = (registro) => {
  if (registro.Debe != null || registro.Haber != null) {
    return (parseFloat(registro.Debe) || 0) - (parseFloat(registro.Haber) || 0);
  }
  return registro.Tipo === 'Entrada' ? parseFloat(registro.Importe) : -parseFloat(registro.Importe);
};

const create = async (req, res) => {
  try {
    const err = validar(req.body);
    if (err) return res.status(400).send({ error: true, message: err });

    const haber = parseFloat(req.body.haber) || 0;
    if (haber > 0) {
      const saldoActual = await model.getSaldoTotal();
      if (haber > saldoActual) {
        return res.status(400).send({ error: true, message: 'No hay saldo suficiente en banco' });
      }
    }

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

    const registroActual = await model.getById(req.params.id);
    if (!registroActual) return res.status(404).send({ error: true, message: 'Movimiento no encontrado' });

    const efectoActual = efectoDe(registroActual);
    const debeNuevo = parseFloat(req.body.debe) || 0;
    const haberNuevo = parseFloat(req.body.haber) || 0;
    const efectoNuevo = debeNuevo - haberNuevo;

    const saldoActual = await model.getSaldoTotal();
    const saldoNuevo = (saldoActual - efectoActual) + efectoNuevo;

    if (saldoNuevo < 0) {
      return res.status(400).send({ error: true, message: 'No hay saldo suficiente en banco para esta edición' });
    }

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
