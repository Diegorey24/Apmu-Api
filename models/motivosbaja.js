const db = require('../helpers/db');
const getAll = async function () {
    const pool = await db.getConnection();
    const rs = await pool.request().query('SELECT * FROM MotivosBaja ORDER BY Nombre');
    return rs.recordset;
};
module.exports = { getAll };