const db = require('../helpers/db');
const crypto = require('crypto');

const getAll = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query(
    'SELECT ID, Usuario, active FROM UsuariosWeb ORDER BY ID'
  );
  return rs.recordset;
};

const create = async function (usuario, password) {
  const pool = await db.getConnection();

  const existe = await pool.request()
    .input('usuario', usuario)
    .query("SELECT ID FROM UsuariosWeb WHERE LTRIM(RTRIM(Usuario)) = LTRIM(RTRIM(@usuario))");
  if (existe.recordset.length > 0) throw new Error('Ya existe un usuario con ese nombre');

  const maxId = await pool.request()
    .query('SELECT ISNULL(MAX(ID), 0) + 1 AS nextId FROM UsuariosWeb');
  const nextId = maxId.recordset[0].nextId;

  const privateKey = crypto.randomBytes(32).toString('hex');

  await pool.request()
    .input('id', nextId)
    .input('usuario', usuario)
    .input('password', password)
    .input('privateKey', privateKey)
    .query(`
      INSERT INTO UsuariosWeb (ID, Usuario, Password, private_key, active)
      VALUES (@id, @usuario, @password, @privateKey, 1)
    `);

  return { id: nextId };
};

const toggleActive = async function (id, active) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .input('active', active)
    .query('UPDATE UsuariosWeb SET active = @active WHERE ID = @id');
};

const cambiarPassword = async function (id, passwordNueva) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .input('password', passwordNueva)
    .query('UPDATE UsuariosWeb SET Password = @password WHERE ID = @id');
};

module.exports = { getAll, create, toggleActive, cambiarPassword };
