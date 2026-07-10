const model = require('../models/solicitudesafiliacion');
const afiliadosModel = require('../models/afiliados');

const getAll = async (req, res) => {
    try {
        const { estado } = req.query;
        const data = await model.getAll(estado);
        res.status(200).send({ error: false, data });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const create = async (req, res) => {
    try {
        const { documento, primerNombre, primerApellido } = req.body;
        if (!documento?.trim()) return res.status(400).send({ error: true, message: 'El documento es obligatorio' });
        if (!primerNombre?.trim()) return res.status(400).send({ error: true, message: 'El nombre es obligatorio' });
        if (!primerApellido?.trim()) return res.status(400).send({ error: true, message: 'El apellido es obligatorio' });
        const id = await model.create(req.body);
        res.status(201).send({ error: false, data: { id } });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const aprobar = async (req, res) => {
    try {
        const solicitud = await model.aprobar(req.params.id, 'admin');
        await afiliadosModel.create({
            Documento: solicitud.Documento,
            PrimerNombre: solicitud.PrimerNombre,
            SegundoNombre: solicitud.SegundoNombre,
            PrimerApellido: solicitud.PrimerApellido,
            SegundoApellido: solicitud.SegundoApellido,
            FechaNacimiento: solicitud.FechaNacimiento,
            EstadoCivil: solicitud.EstadoCivil,
            Mail: solicitud.Mail,
            Departamento: solicitud.Departamento,
            Domicilio: solicitud.Domicilio,
            Telefono: solicitud.Telefono,
            Celular: solicitud.Celular,
            Cargo: solicitud.Cargo,
            FechaIngreso: solicitud.FechaIngreso,
            Sector: solicitud.Sector,
            Turno: solicitud.Turno,
            IdUbicacion: solicitud.IdUbicacion,
            NroFuncionario: solicitud.NroFuncionario,
        });
        res.status(200).send({ error: false });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const rechazar = async (req, res) => {
    try {
        await model.rechazar(req.params.id, req.body?.observaciones, 'admin');
        res.status(200).send({ error: false });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

module.exports = { getAll, create, aprobar, rechazar };