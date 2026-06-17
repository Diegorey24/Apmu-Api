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
        `SELECT TOP 1 Usuario, private_key, active
         FROM UsuariosWeb
         WHERE Usuario = @Username AND Password = @Password`
      );

    if (!rs || rs.rowsAffected[0] === 0) return { data: null };

    const user = rs.recordset[0];
    if (user.active !== 1) throw new Error('Tu usuario está desactivado. Contactá al administrador.');

    return { data: user };
  } catch (err) {
    console.log('SQLException: ' + err.message);
    throw err;
  }
};

module.exports = { authenticate };
