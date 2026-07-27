const model = require('../models/plancuentas');

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
    const { codigo, descripcion, codigoPadre } = req.body;
    if (!codigo?.trim()) return res.status(400).send({ error: true, message: 'El código es obligatorio' });
    if (!descripcion?.trim()) return res.status(400).send({ error: true, message: 'La descripción es obligatoria' });

    const existente = await model.getByCodigo(codigo.trim());
    if (existente) return res.status(400).send({ error: true, message: 'Ya existe un rubro con ese código' });

    await model.create(codigo.trim(), descripcion.trim(), codigoPadre || null);
    res.status(201).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { descripcion, codigoPadre } = req.body;
    if (!descripcion?.trim()) return res.status(400).send({ error: true, message: 'La descripción es obligatoria' });

    const existente = await model.getByCodigo(req.params.codigo);
    if (!existente) return res.status(404).send({ error: true, message: 'Rubro no encontrado' });

    if (codigoPadre && codigoPadre === req.params.codigo) {
      return res.status(400).send({ error: true, message: 'Un rubro no puede ser padre de sí mismo' });
    }

    await model.update(req.params.codigo, descripcion.trim(), codigoPadre || null);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await model.remove(req.params.codigo);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, create, update, remove };
