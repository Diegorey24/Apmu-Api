const model = require('../models/solicitudesprestamo');
const prestamosModel = require('../models/prestamos');

const getAll = async (req, res) => {
    try {
        const { estado } = req.query;
        const data = await model.getAll({ estado });
        res.status(200).send({ error: false, data });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const aprobar = async (req, res) => {
    try {
        const { id } = req.params;
        const { fechaVencimiento } = req.body;

        // Traer la solicitud
        const solicitudes = await model.getAll({});
        const solicitud = solicitudes.find(s => s.Id === parseInt(id));
        if (!solicitud) return res.status(404).send({ error: true, message: 'Solicitud no encontrada' });

        // Crear el préstamo
        await prestamosModel.create(solicitud.IdAfiliado, [
            { idLibro: solicitud.IdLibro, fechaVencimiento: fechaVencimiento || null }
        ]);

        // Marcar como aprobada
        await model.resolver(id, 'Aprobada', 'admin', null);
        res.status(200).send({ error: false });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const rechazar = async (req, res) => {
    try {
        const { observaciones } = req.body;
        await model.resolver(req.params.id, 'Rechazada', 'admin', observaciones);
        res.status(200).send({ error: false });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

module.exports = { getAll, aprobar, rechazar };