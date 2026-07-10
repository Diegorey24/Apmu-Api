const model = require('../models/beneficios');

const getAll = async (req, res) => {
    try {
        const { tipo, anio, idAfiliado } = req.query;
        const data = await model.getAll({ tipo, anio, idAfiliado });
        res.status(200).send({ error: false, data });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

const create = async (req, res) => {
    try {
        const { idAfiliado, tipo, anio, fechaEntrega, idHijo } = req.body;
        if (!idAfiliado) return res.status(400).send({ error: true, message: 'El afiliado es obligatorio' });
        if (!tipo) return res.status(400).send({ error: true, message: 'El tipo es obligatorio' });
        if (!anio) return res.status(400).send({ error: true, message: 'El año es obligatorio' });
        if (!fechaEntrega) return res.status(400).send({ error: true, message: 'La fecha es obligatoria' });
        if (tipo === 'Utiles' && !idHijo) return res.status(400).send({ error: true, message: 'Seleccioná el hijo para útiles escolares' });

        // Verificar duplicado
        const duplicado = await model.verificarDuplicado(idAfiliado, idHijo, tipo, anio);
        if (duplicado) {
            const msg = tipo === 'Canasta'
                ? `Este afiliado ya recibió la canasta en ${anio}`
                : `Este hijo ya recibió útiles escolares en ${anio}`;
            return res.status(400).send({ error: true, message: msg });
        }

        // Verificar préstamos vencidos (advertencia, no bloquea)
        const tieneVencidos = await model.verificarPrestamosVencidos(idAfiliado);

        const id = await model.create(req.body);
        res.status(201).send({ error: false, data: { id, advertencia: tieneVencidos ? 'El afiliado tiene préstamos de libros vencidos' : null } });
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

module.exports = { getAll, create, remove };