const db = require('../helpers/db');

const getAll = async function (filtros = {}) {
  const pool = await db.getConnection();
  const request = pool.request();
  let where = '';
  if (filtros.fechaDesde) { where += ' AND pa.FechaDesde >= @fechaDesde'; request.input('fechaDesde', filtros.fechaDesde); }
  if (filtros.fechaHasta) { where += ' AND pa.FechaHasta <= @fechaHasta'; request.input('fechaHasta', filtros.fechaHasta); }
  if (filtros.estado) { where += ' AND pa.Estado = @estado'; request.input('estado', filtros.estado); }

  const rs = await request.query(`
    SELECT
      pa.*,
      a.NroFuncionario, a.Documento, a.PrimerNombre, a.PrimerApellido, a.Celular, a.Telefono
    FROM PrestamosArticulos pa
    INNER JOIN Afiliados a ON pa.IdAfiliado = a.Id
    WHERE 1=1 ${where}
    ORDER BY pa.FechaPrestamo DESC
  `);
  return rs.recordset;
};

const getById = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('id', id)
    .query(`
      SELECT
        pa.*,
        a.NroFuncionario, a.Documento, a.PrimerNombre, a.PrimerApellido, a.Celular, a.Telefono
      FROM PrestamosArticulos pa
      INNER JOIN Afiliados a ON pa.IdAfiliado = a.Id
      WHERE pa.Id = @id
    `);
  return rs.recordset[0];
};

const existeAfiliadoActivo = async function (idAfiliado) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('id', idAfiliado)
    .query('SELECT COUNT(*) AS total FROM Afiliados WHERE Id = @id AND Activo = 1');
  return rs.recordset[0].total > 0;
};

const create = async function (data) {
  const pool = await db.getConnection();
  const maxIdRes = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM PrestamosArticulos');
  const nextId = maxIdRes.recordset[0].nextId;
  await pool.request()
    .input('id', nextId)
    .input('idAfiliado', data.idAfiliado)
    .input('fechaPrestamo', data.fechaPrestamo)
    .input('fechaDesde', data.fechaDesde)
    .input('fechaHasta', data.fechaHasta)
    .input('articulo', data.articulo)
    .input('observaciones', data.observaciones || null)
    .input('usuario', data.usuario || null)
    .query(`
      INSERT INTO PrestamosArticulos (Id, IdAfiliado, FechaPrestamo, FechaDesde, FechaHasta, Articulo, Observaciones, Estado, Usuario, FechaAlta)
      VALUES (@id, @idAfiliado, @fechaPrestamo, @fechaDesde, @fechaHasta, @articulo, @observaciones, 'Activo', @usuario, GETDATE())
    `);
  return nextId;
};

const update = async function (id, data) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .input('idAfiliado', data.idAfiliado)
    .input('fechaPrestamo', data.fechaPrestamo)
    .input('fechaDesde', data.fechaDesde)
    .input('fechaHasta', data.fechaHasta)
    .input('articulo', data.articulo)
    .input('observaciones', data.observaciones || null)
    .query(`
      UPDATE PrestamosArticulos SET
        IdAfiliado = @idAfiliado, FechaPrestamo = @fechaPrestamo,
        FechaDesde = @fechaDesde, FechaHasta = @fechaHasta,
        Articulo = @articulo, Observaciones = @observaciones
      WHERE Id = @id
    `);
};

const devolver = async function (id) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .query(`UPDATE PrestamosArticulos SET Estado = 'Devuelto', FechaDevolucion = GETDATE() WHERE Id = @id`);
};

const remove = async function (id) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .query('DELETE FROM PrestamosArticulos WHERE Id = @id');
};

module.exports = { getAll, getById, existeAfiliadoActivo, create, update, devolver, remove };
