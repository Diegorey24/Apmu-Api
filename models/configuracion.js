const db = require('../helpers/db');

const getAll = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query('SELECT Id, Clave, Valor FROM Configuracion ORDER BY Clave');
  return rs.recordset;
};

const getByClave = async function (clave) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('clave', clave)
    .query('SELECT Valor FROM Configuracion WHERE Clave = @clave');
  return rs.recordset[0]?.Valor;
};

const update = async function (clave, valor) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('clave', clave)
    .input('valor', valor)
    .query('UPDATE Configuracion SET Valor = @valor WHERE Clave = @clave');
  return rs.rowsAffected[0];
};

module.exports = { getAll, getByClave, update };
