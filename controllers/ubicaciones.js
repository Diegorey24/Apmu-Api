const model = require('../models/ubicaciones');

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
        const { tipo, nombre } = req.body;
        if (!tipo) return res.status(400).send({ error: true, message: 'El tipo es obligatorio' });
        if (!nombre?.trim()) return res.status(400).send({ error: true, message: 'El nombre es obligatorio' });
        const id = await model.create(req.body);
        res.status(201).send({ error: false, data: { id } });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const update = async (req, res) => {
    try {
        const { tipo, nombre } = req.body;
        if (!tipo) return res.status(400).send({ error: true, message: 'El tipo es obligatorio' });
        if (!nombre?.trim()) return res.status(400).send({ error: true, message: 'El nombre es obligatorio' });
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