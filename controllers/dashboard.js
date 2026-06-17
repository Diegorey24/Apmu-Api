const db = require('../helpers/db');

const getStats = async function (req, res) {
  try {
    const pool = await db.getConnection();
    const anioMesActual = parseInt(`${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`);

const rs = await pool.request()
  .input('Aniomes', db.sql.Numeric(6, 0), anioMesActual)
  .query(`
    SELECT
      (SELECT COUNT(*) FROM Afiliados WHERE Activo = 1) AS TotalAfiliados,
      (SELECT COUNT(*) FROM Afiliados WHERE Activo = 0) AS AfiliadosBaja,
      (SELECT COUNT(*) FROM CuentaCorriente WHERE NroRecibo IS NULL AND Aniomes = @Aniomes) AS CargosPendientesMes,
      (SELECT COUNT(*) FROM CuentaCorriente WHERE NroRecibo IS NULL AND FechaVto < GETDATE()) AS CargosVencidos,
      (SELECT ISNULL(SUM(Importe), 0) FROM CuentaCorriente WHERE NroRecibo IS NOT NULL AND Aniomes = @Aniomes) AS TotalCobradoMes,
      (SELECT COUNT(*) FROM PrestamoCabezal WHERE Estado = 'Activo') AS PrestamosActivos,
      (SELECT COUNT(*) FROM PrestamoCabezal WHERE Estado = 'Vencido') AS PrestamosVencidos,
      (SELECT COUNT(*) FROM Libros WHERE FechaBaja IS NULL) AS TotalLibros,
      (SELECT COUNT(*) FROM Libros WHERE FechaBaja IS NULL AND Stock <= 1) AS LibrosStockBajo,
      (SELECT COUNT(*) FROM PrestamoLinea pl
        INNER JOIN PrestamoCabezal pc ON pl.IdPrestamo = pc.Id
        WHERE pl.FechaVencimiento BETWEEN GETDATE() AND DATEADD(day, 7, GETDATE())
          AND pl.FechaDevolucion IS NULL AND pc.Estado = 'Activo') AS PrestamosProximosVencer
  `);

    res.status(200).send({ error: false, data: rs.recordset[0] });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getProximosVencer = async function (req, res) {
  try {
    const pool = await db.getConnection();
    const rs = await pool.request().query(`
      SELECT
        pc.Id AS IdPrestamo,
        a.PrimerNombre + ' ' + a.PrimerApellido AS NombreAfiliado,
        a.Documento,
        l.Nombre AS NombreLibro,
        pl.FechaVencimiento,
        DATEDIFF(day, GETDATE(), pl.FechaVencimiento) AS DiasRestantes
      FROM PrestamoLinea pl
      INNER JOIN PrestamoCabezal pc ON pl.IdPrestamo = pc.Id
      INNER JOIN Afiliados a ON pc.IdAfiliado = a.Id
      INNER JOIN Libros l ON pl.IdLibro = l.Id
      WHERE pl.FechaVencimiento BETWEEN GETDATE() AND DATEADD(day, 7, GETDATE())
        AND pl.FechaDevolucion IS NULL
        AND pc.Estado = 'Activo'
      ORDER BY pl.FechaVencimiento ASC
    `);
    res.status(200).send({ error: false, data: rs.recordset });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getStats, getProximosVencer };