const db = require('../helpers/db');

const getAll = async function (estado) {
  const pool = await db.getConnection();
  let query = `
    SELECT s.*, u.Nombre AS UbicacionNombre
    FROM SolicitudesAfiliacion s
    LEFT JOIN Ubicaciones u ON s.IdUbicacion = u.Id
    WHERE 1=1
  `;
  const request = pool.request();
  if (estado) {
    query += ' AND s.Estado = @estado';
    request.input('estado', estado);
  }
  query += ' ORDER BY s.FechaSolicitud DESC';
  const rs = await request.query(query);
  return rs.recordset;
};

const create = async function (data) {
  const pool = await db.getConnection();
  const maxIdRes = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM SolicitudesAfiliacion');
  const nextId = maxIdRes.recordset[0].nextId;
  await pool.request()
    .input('id', nextId)
    .input('nroFuncionario', data.nroFuncionario || null)
    .input('documento', data.documento)
    .input('primerNombre', data.primerNombre)
    .input('segundoNombre', data.segundoNombre || null)
    .input('primerApellido', data.primerApellido)
    .input('segundoApellido', data.segundoApellido || null)
    .input('fechaNacimiento', data.fechaNacimiento || null)
    .input('estadoCivil', data.estadoCivil || null)
    .input('mail', data.mail || null)
    .input('departamento', data.departamento || null)
    .input('domicilio', data.domicilio || null)
    .input('telefono', data.telefono || null)
    .input('celular', data.celular || null)
    .input('cargo', data.cargo || null)
    .input('fechaIngreso', data.fechaIngreso || null)
    .input('sector', data.sector || null)
    .input('turno', data.turno || null)
    .input('idUbicacion', data.idUbicacion || null)
    .input('hijosJson', Array.isArray(data.hijos) && data.hijos.length ? JSON.stringify(data.hijos) : null)
    .query(`
      INSERT INTO SolicitudesAfiliacion (
        Id, NroFuncionario, Documento, PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido,
        FechaNacimiento, EstadoCivil, Mail, Departamento, Domicilio, Telefono, Celular,
        Cargo, FechaIngreso, Sector, Turno, IdUbicacion, HijosJson
      ) VALUES (
        @id, @nroFuncionario, @documento, @primerNombre, @segundoNombre, @primerApellido, @segundoApellido,
        @fechaNacimiento, @estadoCivil, @mail, @departamento, @domicilio, @telefono, @celular,
        @cargo, @fechaIngreso, @sector, @turno, @idUbicacion, @hijosJson
      )
    `);
  return nextId;
};

const aprobar = async function (id, usuarioResolucion) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .input('usuario', usuarioResolucion)
    .query(`
      UPDATE SolicitudesAfiliacion SET
        Estado = 'Aprobada',
        FechaResolucion = GETDATE(),
        UsuarioResolucion = @usuario
      WHERE Id = @id
    `);

  // Traer datos para crear el afiliado
  const rs = await pool.request()
    .input('id', id)
    .query('SELECT * FROM SolicitudesAfiliacion WHERE Id = @id');
  return rs.recordset[0];
};

const rechazar = async function (id, observaciones, usuarioResolucion) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .input('observaciones', observaciones || null)
    .input('usuario', usuarioResolucion)
    .query(`
      UPDATE SolicitudesAfiliacion SET
        Estado = 'Rechazada',
        FechaResolucion = GETDATE(),
        UsuarioResolucion = @usuario,
        Observaciones = @observaciones
      WHERE Id = @id
    `);
};

module.exports = { getAll, create, aprobar, rechazar };