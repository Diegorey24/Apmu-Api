const db = require('../helpers/db');

const getAll = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query(`
    SELECT Codigo, Descripcion, CodigoPadre FROM PlanCuentas ORDER BY Codigo
  `);
  return rs.recordset;
};

const getByCodigo = async function (codigo) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('codigo', codigo)
    .query('SELECT Codigo, Descripcion, CodigoPadre FROM PlanCuentas WHERE Codigo = @codigo');
  return rs.recordset[0];
};

const create = async function (codigo, descripcion, codigoPadre) {
  const pool = await db.getConnection();
  await pool.request()
    .input('codigo', codigo)
    .input('descripcion', descripcion)
    .input('codigoPadre', codigoPadre || null)
    .query(`
      INSERT INTO PlanCuentas (Codigo, Descripcion, CodigoPadre)
      VALUES (@codigo, @descripcion, @codigoPadre)
    `);
};

const update = async function (codigo, descripcion, codigoPadre) {
  const pool = await db.getConnection();
  await pool.request()
    .input('codigo', codigo)
    .input('descripcion', descripcion)
    .input('codigoPadre', codigoPadre || null)
    .query(`
      UPDATE PlanCuentas SET Descripcion = @descripcion, CodigoPadre = @codigoPadre
      WHERE Codigo = @codigo
    `);
};

const remove = async function (codigo) {
  const pool = await db.getConnection();

  const hijos = await pool.request()
    .input('codigo', codigo)
    .query('SELECT COUNT(*) AS total FROM PlanCuentas WHERE CodigoPadre = @codigo');
  if (hijos.recordset[0].total > 0) {
    throw new Error('No se puede eliminar: el rubro tiene rubros hijos asociados');
  }

  const enCajaChica = await pool.request()
    .input('codigo', codigo)
    .query('SELECT COUNT(*) AS total FROM CajaChica WHERE CodigoCuenta = @codigo');
  if (enCajaChica.recordset[0].total > 0) {
    throw new Error('No se puede eliminar: el rubro está en uso en Fondo Fijo');
  }

  const enBanco = await pool.request()
    .input('codigo', codigo)
    .query('SELECT COUNT(*) AS total FROM Banco WHERE CodigoCuenta = @codigo');
  if (enBanco.recordset[0].total > 0) {
    throw new Error('No se puede eliminar: el rubro está en uso en Banco');
  }

  await pool.request()
    .input('codigo', codigo)
    .query('DELETE FROM PlanCuentas WHERE Codigo = @codigo');
};

module.exports = { getAll, getByCodigo, create, update, remove };
