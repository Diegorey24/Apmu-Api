const db = require('../helpers/db');

const getAll = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .query('SELECT * FROM Rubros ORDER BY RubCod');
  return rs.recordset;
};

const getById = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('RubCod', db.sql.SmallInt, id)
    .query('SELECT * FROM Rubros WHERE RubCod = @RubCod');
  return rs.recordset[0] || null;
};

const create = async function (r) {
  const pool = await db.getConnection();
  await pool.request()
    .input('RubCod',  db.sql.SmallInt,      r.RubCod)
    .input('RubDsc',  db.sql.Char(50),       r.RubDsc)
    .input('Importe', db.sql.Decimal(18, 2), r.Importe || null)
    .query(`
      INSERT INTO Rubros (RubCod, RubDsc, Importe)
      VALUES (@RubCod, @RubDsc, @Importe)
    `);
  return r.RubCod;
};

const update = async function (id, r) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('RubCod',  db.sql.SmallInt,      id)
    .input('RubDsc',  db.sql.Char(50),       r.RubDsc)
    .input('Importe', db.sql.Decimal(18, 2), r.Importe || null)
    .query(`
      UPDATE Rubros SET
        RubDsc  = @RubDsc,
        Importe = @Importe
      WHERE RubCod = @RubCod
    `);
  return rs.rowsAffected[0];
};

const remove = async function (id) {
  const pool = await db.getConnection();

  // Verificar que no tenga movimientos en cuenta corriente
  const check = await pool.request()
    .input('Rubro', db.sql.SmallInt, id)
    .query('SELECT COUNT(*) AS total FROM CuentaCorriente WHERE Rubro = @Rubro');
  if (check.recordset[0].total > 0) {
    throw new Error('No se puede eliminar: el rubro tiene movimientos asociados en cuenta corriente');
  }

  const rs = await pool.request()
    .input('RubCod', db.sql.SmallInt, id)
    .query('DELETE FROM Rubros WHERE RubCod = @RubCod');
  return rs.rowsAffected[0];
};

module.exports = { getAll, getById, create, update, remove };