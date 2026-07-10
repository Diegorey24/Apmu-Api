const model = require('../models/importacionaportes');
const XLSX = require('xlsx');

const importar = async (req, res) => {
    try {
        const { aniomes, idRubro } = req.body;
        if (!aniomes) return res.status(400).send({ error: true, message: 'El período es obligatorio' });
        if (!idRubro) return res.status(400).send({ error: true, message: 'El rubro es obligatorio' });
        if (!req.file) return res.status(400).send({ error: true, message: 'El archivo es obligatorio' });

        // Leer Excel
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Saltar encabezado si existe
        const filas = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row[0] || isNaN(row[0])) continue; // saltar filas sin número de funcionario
            filas.push({
                nroFuncionario: row[0],
                nombre: row[1] || '',
                aporte: row[2] || 0,
            });
        }

        if (filas.length === 0) {
            return res.status(400).send({ error: true, message: 'El archivo no tiene filas válidas' });
        }

        const resultados = await model.importar(filas, parseInt(aniomes), parseInt(idRubro));
        res.status(200).send({ error: false, data: resultados });
    } catch (err) {
        res.status(500).send({ error: true, message: err.message });
    }
};

module.exports = { importar };