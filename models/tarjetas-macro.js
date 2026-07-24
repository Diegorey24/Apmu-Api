const db = require('../helpers/db');

const getAll = async function (filtros = {}) {
  const pool = await db.getConnection();
  const request = pool.request();
  let where = '';
  if (filtros.estado) { where += ' AND tm.Estado = @estado'; request.input('estado', filtros.estado); }

  const rs = await request.query(`
    SELECT
      tm.*,
      a.NroFuncionario, a.Documento, a.PrimerNombre, a.SegundoNombre, a.PrimerApellido, a.SegundoApellido,
      a.Domicilio, a.Departamento, a.Celular, a.Telefono
    FROM TarjetasMacro tm
    INNER JOIN Afiliados a ON tm.IdAfiliado = a.Id
    WHERE 1=1 ${where}
    ORDER BY tm.FechaSolicitud DESC
  `);
  return rs.recordset;
};

const getById = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('id', id)
    .query('SELECT * FROM TarjetasMacro WHERE Id = @id');
  return rs.recordset[0];
};

const existeAfiliadoActivo = async function (idAfiliado) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('id', idAfiliado)
    .query('SELECT COUNT(*) AS total FROM Afiliados WHERE Id = @id AND Activo = 1');
  return rs.recordset[0].total > 0;
};

const tieneSolicitudActiva = async function (idAfiliado) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('idAfiliado', idAfiliado)
    .query(`SELECT COUNT(*) AS total FROM TarjetasMacro WHERE IdAfiliado = @idAfiliado AND Estado <> 'Entregado'`);
  return rs.recordset[0].total > 0;
};

const create = async function (data) {
  const pool = await db.getConnection();
  const maxIdRes = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM TarjetasMacro');
  const nextId = maxIdRes.recordset[0].nextId;
  await pool.request()
    .input('id', nextId)
    .input('idAfiliado', data.idAfiliado)
    .input('observaciones', data.observaciones || null)
    .input('usuario', data.usuario || null)
    .query(`
      INSERT INTO TarjetasMacro (Id, IdAfiliado, Estado, FechaSolicitud, FechaCambioEstado, Observaciones, Usuario)
      VALUES (@id, @idAfiliado, 'Pendiente', GETDATE(), GETDATE(), @observaciones, @usuario)
    `);
  return nextId;
};

const cambiarEstado = async function (id, nuevoEstado) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .input('nuevoEstado', nuevoEstado)
    .query(`
      UPDATE TarjetasMacro SET Estado = @nuevoEstado, FechaCambioEstado = GETDATE()
      WHERE Id = @id
    `);
};

const remove = async function (id) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .query('DELETE FROM TarjetasMacro WHERE Id = @id');
};

module.exports = { getAll, getById, existeAfiliadoActivo, tieneSolicitudActiva, create, cambiarEstado, remove };
