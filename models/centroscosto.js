const db = require('../helpers/db');

const getAll = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query(`
    SELECT Id, Codigo, Nombre FROM CentrosCosto ORDER BY Id
  `);
  return rs.recordset;
};

const getById = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('id', id)
    .query('SELECT Id, Codigo, Nombre FROM CentrosCosto WHERE Id = @id');
  return rs.recordset[0];
};

const create = async function (codigo, nombre) {
  const pool = await db.getConnection();
  const maxIdRes = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM CentrosCosto');
  const nextId = maxIdRes.recordset[0].nextId;
  await pool.request()
    .input('id', nextId)
    .input('codigo', codigo)
    .input('nombre', nombre)
    .query('INSERT INTO CentrosCosto (Id, Codigo, Nombre) VALUES (@id, @codigo, @nombre)');
  return nextId;
};

const update = async function (id, codigo, nombre) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .input('codigo', codigo)
    .input('nombre', nombre)
    .query('UPDATE CentrosCosto SET Codigo = @codigo, Nombre = @nombre WHERE Id = @id');
};

const remove = async function (id) {
  const pool = await db.getConnection();

  const enCajaChica = await pool.request()
    .input('id', id)
    .query('SELECT COUNT(*) AS total FROM CajaChica WHERE IdCentroCosto = @id');
  if (enCajaChica.recordset[0].total > 0) {
    throw new Error('No se puede eliminar: el centro de costo está en uso en Fondo Fijo');
  }

  const enBanco = await pool.request()
    .input('id', id)
    .query('SELECT COUNT(*) AS total FROM Banco WHERE IdCentroCosto = @id');
  if (enBanco.recordset[0].total > 0) {
    throw new Error('No se puede eliminar: el centro de costo está en uso en Banco');
  }

  await pool.request()
    .input('id', id)
    .query('DELETE FROM CentrosCosto WHERE Id = @id');
};

module.exports = { getAll, getById, create, update, remove };
