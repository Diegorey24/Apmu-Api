const model = require('../models/solicitudesafiliacion');
const afiliadosModel = require('../models/afiliados');
const hijosModel = require('../models/hijos');

// El form público solo pide "Nombre" (texto libre) para cada hijo; Hijos.PrimerApellido
// es NOT NULL en la BD, así que separamos la primera palabra como nombre y el resto
// como apellido, usando el apellido del afiliado como respaldo si no hay resto.
const splitNombreHijo = (nombreCompleto, apellidoFallback) => {
    const partes = (nombreCompleto || '').trim().split(/\s+/);
    const primerNombre = partes.shift() || '';
    const primerApellido = partes.join(' ') || apellidoFallback || '-';
    return { primerNombre, primerApellido };
};

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
        const {
            nroFuncionario, documento, primerNombre, primerApellido, fechaNacimiento,
            estadoCivil, mail, departamento, domicilio, telefono, celular,
            cargo, fechaIngreso, hijos,
        } = req.body;
        const faltante = (val) => !val || !String(val).trim();
        if (faltante(nroFuncionario)) return res.status(400).send({ error: true, message: 'El nº de funcionario es obligatorio' });
        if (faltante(documento)) return res.status(400).send({ error: true, message: 'El documento es obligatorio' });
        if (faltante(primerNombre)) return res.status(400).send({ error: true, message: 'El nombre es obligatorio' });
        if (faltante(primerApellido)) return res.status(400).send({ error: true, message: 'El apellido es obligatorio' });
        if (faltante(fechaNacimiento)) return res.status(400).send({ error: true, message: 'La fecha de nacimiento es obligatoria' });
        if (faltante(estadoCivil)) return res.status(400).send({ error: true, message: 'El estado civil es obligatorio' });
        if (faltante(mail)) return res.status(400).send({ error: true, message: 'El mail es obligatorio' });
        if (faltante(departamento)) return res.status(400).send({ error: true, message: 'El departamento es obligatorio' });
        if (faltante(domicilio)) return res.status(400).send({ error: true, message: 'La dirección es obligatoria' });
        if (faltante(telefono) && faltante(celular)) return res.status(400).send({ error: true, message: 'Debe ingresar teléfono o celular' });
        if (faltante(cargo)) return res.status(400).send({ error: true, message: 'El cargo es obligatorio' });
        if (faltante(fechaIngreso)) return res.status(400).send({ error: true, message: 'La fecha de ingreso es obligatoria' });
        if (Array.isArray(hijos)) {
            for (const h of hijos) {
                if (faltante(h.nombre) || faltante(h.documento) || faltante(h.fechaNacimiento)) {
                    return res.status(400).send({ error: true, message: 'Los datos de todos los hijos son obligatorios' });
                }
            }
        }
        const id = await model.create(req.body);
        res.status(201).send({ error: false, data: { id } });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const aprobar = async (req, res) => {
    try {
        const solicitud = await model.aprobar(req.params.id, 'admin');
        const idAfiliado = await afiliadosModel.create({
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

        if (solicitud.HijosJson) {
            let hijos = [];
            try { hijos = JSON.parse(solicitud.HijosJson); } catch { hijos = []; }
            for (const hijo of hijos) {
                const { primerNombre, primerApellido } = splitNombreHijo(hijo.nombre, solicitud.PrimerApellido);
                await hijosModel.create({
                    idAfiliado,
                    primerNombre,
                    primerApellido,
                    documento: hijo.documento || null,
                    fechaNacimiento: hijo.fechaNacimiento || null,
                });
            }
        }

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