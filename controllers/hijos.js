const model = require('../models/hijos');

const getByAfiliado = async (req, res) => {
    try {
        const data = await model.getByAfiliado(req.params.idAfiliado);
        res.status(200).send({ error: false, data });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const create = async (req, res) => {
    try {
        const { primerNombre, primerApellido, idAfiliado } = req.body;
        if (!primerNombre?.trim()) return res.status(400).send({ error: true, message: 'El primer nombre es obligatorio' });
        if (!primerApellido?.trim()) return res.status(400).send({ error: true, message: 'El primer apellido es obligatorio' });
        if (!idAfiliado) return res.status(400).send({ error: true, message: 'El afiliado es obligatorio' });
        const id = await model.create(req.body);
        res.status(201).send({ error: false, data: { id } });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const update = async (req, res) => {
    try {
        const { primerNombre, primerApellido } = req.body;
        if (!primerNombre?.trim()) return res.status(400).send({ error: true, message: 'El primer nombre es obligatorio' });
        if (!primerApellido?.trim()) return res.status(400).send({ error: true, message: 'El primer apellido es obligatorio' });
        await model.update(req.params.id, req.body);
        res.status(200).send({ error: false });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const validar = async (req, res) => {
    try {
        const { validado } = req.body;
        await model.validar(req.params.id, validado ? 1 : 0);
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

module.exports = { getByAfiliado, create, update, validar, remove };