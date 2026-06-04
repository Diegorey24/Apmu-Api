const db = require('../helpers/db');

const getAll = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query('SELECT * FROM Autores ORDER BY Autor');
  return rs.recordset;
};

const getById = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('ID', db.sql.NChar(10), id)
    .query('SELECT * FROM Autores WHERE ID = @ID');
  return rs.recordset[0] || null;
};

const create = async function (autor) {
  const pool = await db.getConnection();
  await pool.request()
    .input('ID',    db.sql.NChar(10),   autor.ID)
    .input('Autor', db.sql.VarChar(100), autor.Autor || null)
    .query('INSERT INTO Autores (ID, Autor) VALUES (@ID, @Autor)');
};

const update = async function (id, autor) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('ID',    db.sql.NChar(10),   id)
    .input('Autor', db.sql.VarChar(100), autor.Autor || null)
    .query('UPDATE Autores SET Autor = @Autor WHERE ID = @ID');
  return rs.rowsAffected[0];
};

const remove = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('ID', db.sql.NChar(10), id)
    .query('DELETE FROM Autores WHERE ID = @ID');
  return rs.rowsAffected[0];
};

module.exports = { getAll, getById, create, update, remove };
