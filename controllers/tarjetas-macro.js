const model = require('../models/tarjetas-macro');

const ORDEN_ESTADOS = ['Pendiente', 'Solicitado', 'En APMU', 'Entregado'];

const getAll = async (req, res) => {
  try {
    const { estado } = req.query;
    const data = await model.getAll({ estado });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { idAfiliado } = req.body;
    if (!idAfiliado) return res.status(400).send({ error: true, message: 'El afiliado es obligatorio' });

    const activo = await model.existeAfiliadoActivo(idAfiliado);
    if (!activo) return res.status(400).send({ error: true, message: 'El afiliado no existe o no está activo' });

    const tieneActiva = await model.tieneSolicitudActiva(idAfiliado);
    if (tieneActiva) return res.status(400).send({ error: true, message: 'Este afiliado ya tiene una solicitud de tarjeta en curso' });

    const id = await model.create(req.body);
    res.status(201).send({ error: false, data: { id } });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const cambiarEstado = async (req, res) => {
  try {
    const { nuevoEstado } = req.body;
    if (!ORDEN_ESTADOS.includes(nuevoEstado)) {
      return res.status(400).send({ error: true, message: 'El estado no es válido' });
    }

    const registro = await model.getById(req.params.id);
    if (!registro) return res.status(404).send({ error: true, message: 'Tarjeta no encontrada' });

    const indiceActual = ORDEN_ESTADOS.indexOf(registro.Estado);
    const indiceNuevo = ORDEN_ESTADOS.indexOf(nuevoEstado);
    if (indiceNuevo !== indiceActual + 1) {
      return res.status(400).send({
        error: true,
        message: `El estado debe avanzar en orden: ${ORDEN_ESTADOS.join(' → ')}`,
      });
    }

    await model.cambiarEstado(req.params.id, nuevoEstado);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const registro = await model.getById(req.params.id);
    if (!registro) return res.status(404).send({ error: true, message: 'Tarjeta no encontrada' });
    if (registro.Estado !== 'Pendiente') {
      return res.status(400).send({ error: true, message: 'Solo se puede eliminar una solicitud en estado Pendiente' });
    }

    await model.remove(req.params.id);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, create, cambiarEstado, remove };
