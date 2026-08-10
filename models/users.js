const db = require('../helpers/db');
const bcrypt = require('bcryptjs');

const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$/;

/**
 * Valida usuario y contraseña contra la tabla Usuarios.
 * Devuelve { data: { id, username, rol } } o { data: null } si no matchea.
 */
const authenticate = async function (username, password) {
  try {
    const pool = await db.getConnection();

    const rs = await pool
      .request()
      .input('Username', db.sql.VarChar(50), username)
      .query(
        `SELECT TOP 1 Id, Username, Password, Rol, Activo
         FROM Usuarios
         WHERE Username = @Username`
      );

    if (!rs || rs.recordset.length === 0) return { data: null };

    const user = rs.recordset[0];
    if (!user.Activo) throw new Error('Tu usuario está desactivado. Contactá al administrador.');

    const match = await bcrypt.compare(password, user.Password);
    if (!match) return { data: null };

    return {
      data: {
        id: user.Id,
        username: user.Username.trim(),
        rol: user.Rol.trim(),
      },
    };
  } catch (err) {
    console.log('SQLException: ' + err.message);
    throw err;
  }
};

/**
 * Migración idempotente: hashea con bcrypt cualquier password de la tabla
 * Usuarios que todavía esté en texto plano (no tenga formato bcrypt).
 * Pensada para correrse al arrancar el servidor.
 */
const hashPlaintextPasswords = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query('SELECT Id, Password FROM Usuarios');

  for (const row of rs.recordset) {
    if (BCRYPT_REGEX.test(row.Password || '')) continue;

    const hash = await bcrypt.hash(row.Password, 10);
    await pool
      .request()
      .input('Id', db.sql.Int, row.Id)
      .input('Password', db.sql.VarChar(255), hash)
      .query('UPDATE Usuarios SET Password = @Password WHERE Id = @Id');

    console.log(`[migración] Password hasheada para Usuario Id=${row.Id}`);
  }
};

module.exports = { authenticate, hashPlaintextPasswords };
