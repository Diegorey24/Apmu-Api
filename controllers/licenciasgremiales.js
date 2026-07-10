const model = require('../models/licenciasgremiales');

const getAll = async (req, res) => {
    try {
        const { idAfiliado, fechaDesde, fechaHasta } = req.query;
        const data = await model.getAll({ idAfiliado, fechaDesde, fechaHasta });
        res.status(200).send({ error: false, data });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const create = async (req, res) => {
    try {
        const { idAfiliado, fechaLicencia } = req.body;
        if (!idAfiliado) return res.status(400).send({ error: true, message: 'El afiliado es obligatorio' });
        if (!fechaLicencia) return res.status(400).send({ error: true, message: 'La fecha es obligatoria' });
        const id = await model.create(req.body);
        res.status(201).send({ error: false, data: { id } });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const update = async (req, res) => {
    try {
        const { idAfiliado, fechaLicencia } = req.body;
        if (!idAfiliado) return res.status(400).send({ error: true, message: 'El afiliado es obligatorio' });
        if (!fechaLicencia) return res.status(400).send({ error: true, message: 'La fecha es obligatoria' });
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