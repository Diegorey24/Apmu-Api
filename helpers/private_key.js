const db = require('../helpers/db');

const value = async function (username) {
  try {
    const pool = await db.getConnection();

    const rs = await pool
      .request()
      .input('Username', db.sql.VarChar(80), username)
      .query('SELECT TOP 1 private_key FROM UsuariosWeb WHERE Usuario = @Username AND active = 1');

    if (rs && rs.rowsAffected[0] > 0) {
      return rs.recordset[0].private_key;
    }
    return null;
  } catch (err) {
    console.log('SQLException: ' + err.message);
    throw err;
  }
};

module.exports = { value };
