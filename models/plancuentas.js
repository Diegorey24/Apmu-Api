const db = require('../helpers/db');

const getAll = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query(`
    SELECT Codigo, Descripcion, CodigoPadre FROM PlanCuentas ORDER BY Codigo
  `);
  return rs.recordset;
};

module.exports = { getAll };
