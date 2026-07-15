const db = require('../helpers/db');

const importar = async function (filas, aniomes, idRubro) {
    const pool = await db.getConnection();
    const resultados = { importados: 0, noEncontrados: [], errores: [] };

    for (const fila of filas) {
        try {
            // Buscar afiliado por NroFuncionario
            const afiliadoRes = await pool.request()
                .input('nroFuncionario', String(fila.nroFuncionario))
                .query('SELECT Id FROM Afiliados WHERE NroFuncionario = @nroFuncionario AND Activo = 1');

            if (!afiliadoRes.recordset[0]) {
                resultados.noEncontrados.push({
                    nroFuncionario: fila.nroFuncionario,
                    nombre: fila.nombre,
                });
                continue;
            }

            const idAfiliado = afiliadoRes.recordset[0].Id;

            // Verificar si ya existe un aporte para ese afiliado en ese período y rubro
            const existeRes = await pool.request()
                .input('idAfiliado', idAfiliado)
                .input('aniomes', aniomes)
                .input('rubro', idRubro)
                .query(`
          SELECT Id FROM CuentaCorriente 
          WHERE IdAfiliado = @idAfiliado AND Aniomes = @aniomes AND Rubro = @rubro
        `);

            if (existeRes.recordset.length > 0) {
                resultados.errores.push({
                    nroFuncionario: fila.nroFuncionario,
                    nombre: fila.nombre,
                    motivo: 'Ya tiene aporte cargado para este período',
                });
                continue;
            }

            // Insertar aporte
            // Calcular próximo Id
            const maxIdRes = await pool.request()
                .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM CuentaCorriente');
            const nextId = maxIdRes.recordset[0].nextId;

            // NroRecibo correlativo
            const maxReciboRes = await pool.request()
                .query('SELECT ISNULL(MAX(NroRecibo), 0) + 1 AS nextRecibo FROM CuentaCorriente WHERE NroRecibo IS NOT NULL');
            const nextRecibo = maxReciboRes.recordset[0].nextRecibo;

            // Insertar aporte como pagado
            const mes = String(aniomes).substring(0, 4) + '-' + String(aniomes).substring(4, 6) + '-01';
            await pool.request()
                .input('id', nextId)
                .input('idAfiliado', idAfiliado)
                .input('rubro', idRubro)
                .input('importe', parseFloat(fila.aporte) || 0)
                .input('aniomes', aniomes)
                .input('mes', mes)
                .input('nroRecibo', nextRecibo)
                .input('fechaPago', new Date())
                .input('formaPago', 'Planilla')
                .query(`
          INSERT INTO CuentaCorriente (Id, IdAfiliado, Rubro, Importe, Aniomes, Mes, NroRecibo, FechaPago, FormaPago)
          VALUES (@id, @idAfiliado, @rubro, @importe, @aniomes, @mes, @nroRecibo, @fechaPago, @formaPago)
        `);

            resultados.importados++;
        } catch (err) {
            resultados.errores.push({
                nroFuncionario: fila.nroFuncionario,
                nombre: fila.nombre,
                motivo: err.message,
            });
        }
    }

    return resultados;
};

module.exports = { importar };