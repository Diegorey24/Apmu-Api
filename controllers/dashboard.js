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
          (SELECT COUNT(*) FROM CuentaCorriente WHERE NroRecibo IS NULL AND Aniomes = @Aniomes) AS CargosPendientesMes,
          (SELECT COUNT(*) FROM CuentaCorriente WHERE NroRecibo IS NULL AND FechaVto < GETDATE()) AS CargosVencidos,
          (SELECT ISNULL(SUM(Importe), 0) FROM CuentaCorriente WHERE NroRecibo IS NOT NULL AND Aniomes = @Aniomes) AS TotalCobradoMes
      `);

    res.status(200).send({ error: false, data: rs.recordset[0] });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getStats };