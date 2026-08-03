const model = require('../models/hijos');
const db = require('../helpers/db');

const validarCI = (ci) => {
    const clean = ci.replace(/\D/g, '');
    if (clean.length < 7 || clean.length > 8) return false;
    const padded = clean.padStart(8, '0');
    const digits = padded.split('').map(Number);
    const factors = [2, 9, 8, 7, 6, 3, 4];
    let sum = 0;
    for (let i = 0; i < 7; i++) sum += digits[i] * factors[i];
    const check = (10 - (sum % 10)) % 10;
    return check === digits[7];
};

const verificarAfiliadoActivo = async (id) => {
    const pool = await db.getConnection();
    const rs = await pool.request()
        .input('id', id)
        .query('SELECT TOP 1 Id FROM Afiliados WHERE Id = @id AND Activo = 1');
    return !!rs.recordset[0];
};

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
        const { primerNombre, primerApellido, idAfiliado, documento, fechaNacimiento } = req.body;
        if (!primerNombre?.trim()) return res.status(400).send({ error: true, message: 'El primer nombre es obligatorio' });
        if (!primerApellido?.trim()) return res.status(400).send({ error: true, message: 'El primer apellido es obligatorio' });
        if (!idAfiliado) return res.status(400).send({ error: true, message: 'El afiliado es obligatorio' });
        if (!documento?.trim()) return res.status(400).send({ error: true, message: 'La cédula (CI) del hijo es obligatoria' });
        if (!fechaNacimiento) return res.status(400).send({ error: true, message: 'La fecha de nacimiento es obligatoria' });

        if (!validarCI(documento)) {
            return res.status(400).send({ error: true, message: 'La cédula del hijo no es válida' });
        }

        const existente = await model.findByDocumento(documento);
        if (existente) {
            const idAfiliadoNum = parseInt(idAfiliado);
            const yaAsociados = [existente.IdAfiliado, existente.IdAfiliadoSecundario].filter(Boolean);
            if (!yaAsociados.includes(idAfiliadoNum)) {
                return res.status(400).send({ error: true, message: 'Este hijo ya está asociado a otro afiliado. Utilice "Cambiar titular" para reasignarlo.' });
            }
        }

        const id = await model.create({ ...req.body, idAfiliadoSecundario: null });
        res.status(201).send({ error: false, data: { id } });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const update = async (req, res) => {
    try {
        const { primerNombre, primerApellido, documento, fechaNacimiento } = req.body;
        if (!primerNombre?.trim()) return res.status(400).send({ error: true, message: 'El primer nombre es obligatorio' });
        if (!primerApellido?.trim()) return res.status(400).send({ error: true, message: 'El primer apellido es obligatorio' });
        if (!documento?.trim()) return res.status(400).send({ error: true, message: 'La cédula (CI) del hijo es obligatoria' });
        if (!fechaNacimiento) return res.status(400).send({ error: true, message: 'La fecha de nacimiento es obligatoria' });

        if (!validarCI(documento)) {
            return res.status(400).send({ error: true, message: 'La cédula del hijo no es válida' });
        }

        const registroActual = await model.getById(req.params.id);
        if (!registroActual) return res.status(404).send({ error: true, message: 'Hijo no encontrado' });

        const existente = await model.findByDocumento(documento, req.params.id);
        if (existente) {
            const yaAsociados = [existente.IdAfiliado, existente.IdAfiliadoSecundario].filter(Boolean);
            if (!yaAsociados.includes(registroActual.IdAfiliado)) {
                return res.status(400).send({ error: true, message: 'Este hijo ya está asociado a otro afiliado. Utilice "Cambiar titular" para reasignarlo.' });
            }
        }

        await model.update(req.params.id, { ...req.body, idAfiliadoSecundario: null });
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

const cambiarTitular = async (req, res) => {
    try {
        const { idAfiliado } = req.body;
        if (!idAfiliado) return res.status(400).send({ error: true, message: 'Debe indicar el nuevo afiliado titular' });

        const registroActual = await model.getById(req.params.id);
        if (!registroActual) return res.status(404).send({ error: true, message: 'Hijo no encontrado' });

        const activo = await verificarAfiliadoActivo(idAfiliado);
        if (!activo) return res.status(400).send({ error: true, message: 'El afiliado seleccionado no existe o no está activo' });

        await model.cambiarTitular(req.params.id, idAfiliado);
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

module.exports = { getByAfiliado, create, update, validar, remove, cambiarTitular };