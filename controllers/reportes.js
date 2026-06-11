const db = require('../helpers/db');

const getDeudaAfiliado = async function (req, res) {
  try {
    const { idAfiliado } = req.params;
    const pool = await db.getConnection();

    // Datos del afiliado
    const afiliadoRes = await pool.request()
      .input('id', idAfiliado)
      .query(`
        SELECT Id, Documento, PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido
        FROM Afiliados WHERE Id = @id AND Activo = 1
      `);
    if (!afiliadoRes.recordset[0]) {
      return res.status(404).send({ error: true, message: 'Afiliado no encontrado' });
    }

    // Movimientos agrupados por período
    const movimientos = await pool.request()
      .input('id', idAfiliado)
      .query(`
        SELECT
          cc.Aniomes,
          r.RubDsc AS Rubro,
          cc.Importe,
          cc.FechaVto,
          cc.FechaPago,
          cc.NroRecibo,
          cc.FormaPago,
          CASE WHEN cc.NroRecibo IS NOT NULL THEN 'Pagado'
               WHEN cc.FechaVto < GETDATE() THEN 'Vencido'
               ELSE 'Pendiente'
          END AS Estado
        FROM CuentaCorriente cc
        LEFT JOIN Rubros r ON cc.Rubro = r.RubCod
        WHERE cc.IdAfiliado = @id
        ORDER BY cc.Aniomes DESC, r.RubDsc
      `);

    // Totales
    const totales = await pool.request()
      .input('id', idAfiliado)
      .query(`
        SELECT
          ISNULL(SUM(CASE WHEN NroRecibo IS NULL THEN Importe ELSE 0 END), 0) AS TotalDeuda,
          ISNULL(SUM(CASE WHEN NroRecibo IS NOT NULL THEN Importe ELSE 0 END), 0) AS TotalPagado,
          ISNULL(SUM(Importe), 0) AS TotalGeneral
        FROM CuentaCorriente WHERE IdAfiliado = @id
      `);

    res.status(200).send({
      error: false,
      data: {
        afiliado: afiliadoRes.recordset[0],
        movimientos: movimientos.recordset,
        totales: totales.recordset[0],
      }
    });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getConciliacion = async function (req, res) {
  try {
    const { aniomes, idRubro } = req.query;
    if (!aniomes || !idRubro) {
      return res.status(400).send({ error: true, message: 'Faltan parámetros' });
    }
    const pool = await db.getConnection();

    const rs = await pool.request()
      .input('aniomes', aniomes)
      .input('idRubro', idRubro)
      .query(`
        SELECT
          a.Id,
          a.Documento,
          a.PrimerNombre + ' ' + a.PrimerApellido + ISNULL(' ' + a.SegundoApellido, '') AS NombreAfiliado,
          CASE WHEN cc.Id IS NOT NULL THEN 1 ELSE 0 END AS TieneAporte,
          cc.Importe,
          cc.NroRecibo,
          cc.FechaPago
        FROM Afiliados a
        LEFT JOIN CuentaCorriente cc 
          ON cc.IdAfiliado = a.Id 
          AND cc.Aniomes = @aniomes 
          AND cc.Rubro = @idRubro
        WHERE a.Activo = 1
        ORDER BY a.PrimerApellido, a.PrimerNombre
      `);

    const todos = rs.recordset;
    const conAporte = todos.filter(r => r.TieneAporte === 1);
    const sinAporte = todos.filter(r => r.TieneAporte === 0);

    res.status(200).send({
      error: false,
      data: { todos, conAporte, sinAporte, total: todos.length, totalCon: conAporte.length, totalSin: sinAporte.length }
    });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getDeudaAfiliado, getConciliacion };