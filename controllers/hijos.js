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

const buscarAfiliadoPorDocumento = async (documento) => {
    const pool = await db.getConnection();
    const rs = await pool.request()
        .input('doc', documento)
        .query('SELECT TOP 1 Id FROM Afiliados WHERE Documento = @doc AND Activo = 1');
    return rs.recordset[0]?.Id || null;
};

const calcularIdAfiliadoSecundario = (idAfiliado, idAfiliadoPadre, idAfiliadoMadre) => {
    const idAfiliadoNum = parseInt(idAfiliado);
    if (idAfiliadoPadre && idAfiliadoPadre !== idAfiliadoNum) return idAfiliadoPadre;
    if (idAfiliadoMadre && idAfiliadoMadre !== idAfiliadoNum) return idAfiliadoMadre;
    return null;
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
        const { primerNombre, primerApellido, idAfiliado } = req.body;
        if (!primerNombre?.trim()) return res.status(400).send({ error: true, message: 'El primer nombre es obligatorio' });
        if (!primerApellido?.trim()) return res.status(400).send({ error: true, message: 'El primer apellido es obligatorio' });
        if (!idAfiliado) return res.status(400).send({ error: true, message: 'El afiliado es obligatorio' });
        const { documento, cedulaPadre, cedulaMadre } = req.body;

        if (documento && !validarCI(documento)) {
            return res.status(400).send({ error: true, message: 'La cédula del hijo no es válida' });
        }

        let idAfiliadoPadre = null;
        let idAfiliadoMadre = null;

        if (cedulaPadre) {
            idAfiliadoPadre = await buscarAfiliadoPorDocumento(cedulaPadre);
            if (!idAfiliadoPadre) return res.status(400).send({ error: true, message: 'La cédula del padre no corresponde a un afiliado activo' });
        }
        if (cedulaMadre) {
            idAfiliadoMadre = await buscarAfiliadoPorDocumento(cedulaMadre);
            if (!idAfiliadoMadre) return res.status(400).send({ error: true, message: 'La cédula de la madre no corresponde a un afiliado activo' });
        }

        const idAfiliadoSecundario = calcularIdAfiliadoSecundario(idAfiliado, idAfiliadoPadre, idAfiliadoMadre);

        const id = await model.create({ ...req.body, idAfiliadoSecundario });
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
        const { documento, cedulaPadre, cedulaMadre } = req.body;

        if (documento && !validarCI(documento)) {
            return res.status(400).send({ error: true, message: 'La cédula del hijo no es válida' });
        }

        const registroActual = await model.getById(req.params.id);
        if (!registroActual) return res.status(404).send({ error: true, message: 'Hijo no encontrado' });

        let idAfiliadoPadre = null;
        let idAfiliadoMadre = null;

        if (cedulaPadre) {
            idAfiliadoPadre = await buscarAfiliadoPorDocumento(cedulaPadre);
            if (!idAfiliadoPadre) return res.status(400).send({ error: true, message: 'La cédula del padre no corresponde a un afiliado activo' });
        }
        if (cedulaMadre) {
            idAfiliadoMadre = await buscarAfiliadoPorDocumento(cedulaMadre);
            if (!idAfiliadoMadre) return res.status(400).send({ error: true, message: 'La cédula de la madre no corresponde a un afiliado activo' });
        }

        const idAfiliadoSecundario = calcularIdAfiliadoSecundario(registroActual.IdAfiliado, idAfiliadoPadre, idAfiliadoMadre);

        await model.update(req.params.id, { ...req.body, idAfiliadoSecundario });
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