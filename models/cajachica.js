const db = require('../helpers/db');

const getAll = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query(`
    SELECT Id, Fecha, Tipo, Descripcion, Importe, Usuario,
      SUM(CASE WHEN Tipo = 'Entrada' THEN Importe ELSE -Importe END)
        OVER (ORDER BY Fecha, Id) AS SaldoAcumulado
    FROM CajaChica
    ORDER BY Fecha, Id
  `);
  return rs.recordset;
};

const getResumen = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query(`
    SELECT
      ISNULL(SUM(CASE WHEN Tipo = 'Entrada' THEN Importe ELSE 0 END), 0) AS TotalEntradas,
      ISNULL(SUM(CASE WHEN Tipo = 'Salida' THEN Importe ELSE 0 END), 0) AS TotalSalidas,
      ISNULL(SUM(CASE WHEN Tipo = 'Entrada' THEN Importe ELSE -Importe END), 0) AS Saldo
    FROM CajaChica
  `);
  return rs.recordset[0];
};

const create = async function (data) {
  const pool = await db.getConnection();
  const maxIdRes = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM CajaChica');
  const nextId = maxIdRes.recordset[0].nextId;
  await pool.request()
    .input('id', nextId)
    .input('fecha', data.fecha)
    .input('tipo', data.tipo)
    .input('descripcion', data.descripcion)
    .input('importe', data.importe)
    .input('usuario', data.usuario || null)
    .query(`
      INSERT INTO CajaChica (Id, Fecha, Tipo, Descripcion, Importe, Usuario)
      VALUES (@id, @fecha, @tipo, @descripcion, @importe, @usuario)
    `);
  return nextId;
};

const update = async function (id, data) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .input('fecha', data.fecha)
    .input('tipo', data.tipo)
    .input('descripcion', data.descripcion)
    .input('importe', data.importe)
    .input('usuario', data.usuario || null)
    .query(`
      UPDATE CajaChica SET
        Fecha = @fecha, Tipo = @tipo, Descripcion = @descripcion,
        Importe = @importe, Usuario = @usuario
      WHERE Id = @id
    `);
};

const remove = async function (id) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .query('DELETE FROM CajaChica WHERE Id = @id');
};

const getSaldoTotal = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query(`
    SELECT ISNULL(SUM(CASE WHEN Tipo = 'Entrada' THEN Importe ELSE -Importe END), 0) AS Saldo
    FROM CajaChica
  `);
  return rs.recordset[0].Saldo;
};

const getById = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('id', id)
    .query('SELECT * FROM CajaChica WHERE Id = @id');
  return rs.recordset[0];
};

module.exports = { getAll, getResumen, getSaldoTotal, getById, create, update, remove };