const db = require('../helpers/db');
const md5 = require('md5');

const authenticate = async function (username, password) {
  try {
    const pool = await db.getConnection();

    const rs = await pool
      .request()
      .input('Username', db.sql.VarChar(80), username)
      .input('Password', db.sql.VarChar(100), password)
      .query(
        `SELECT TOP 1 Usuario, private_key
         FROM UsuariosWeb
         WHERE Usuario = @Username AND Password = @Password AND active = 1`
      );

    if (rs && rs.rowsAffected[0] > 0) {
      return { data: rs.recordset[0] };
    }
    return { data: null };
  } catch (err) {
    console.log('SQLException: ' + err.message);
    throw err;
  }
};

module.exports = { authenticate };
