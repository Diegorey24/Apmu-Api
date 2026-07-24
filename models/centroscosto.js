const db = require('../helpers/db');

const getAll = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query(`
    SELECT Id, Codigo, Nombre FROM CentrosCosto ORDER BY Id
  `);
  return rs.recordset;
};

module.exports = { getAll };
