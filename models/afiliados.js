const db = require('../helpers/db');

const getAll = async function ({ page = 1, limit = 20, search = '', activo = 1 }) {
  const pool = await db.getConnection();
  const offset = (page - 1) * limit;

  let where = 'WHERE Activo = @activo';
  const request = pool.request();
  request.input('activo', db.sql.Bit, activo);

  if (search) {
    where += ' AND (PrimerNombre LIKE @search OR PrimerApellido LIKE @search OR Documento LIKE @search OR NroFuncionario LIKE @search)';
    request.input('search', db.sql.VarChar(100), `%${search}%`);
  }

  request.input('offset', db.sql.Int, offset);
  request.input('limit', db.sql.Int, limit);

  const rs = await request.query(`
  SELECT a.*, 
    c.Nombre AS NombreCategoria,
    u.Nombre AS NombreUbicacion,
    COUNT(*) OVER() AS TotalRecords
  FROM Afiliados a
  LEFT JOIN Categorias c ON a.IdCategoria = c.Id
  LEFT JOIN Ubicaciones u ON a.IdUbicacion = u.Id
  ${where}
  ORDER BY ${activo ? 'a.Id' : 'a.FechaBaja DESC'}
  OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
`);

  const total = rs.recordset.length > 0 ? rs.recordset[0].TotalRecords : 0;
  const data = rs.recordset.map(({ TotalRecords, ...row }) => row);
  return { data, total, page: +page, limit: +limit };
};

const getById = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('Id', db.sql.Int, id)
    .query('SELECT * FROM Afiliados WHERE Id = @Id AND Activo = 1');
  return rs.recordset[0] || null;
};

const create = async function (a) {
  const pool = await db.getConnection();
  const maxIdRes = await pool.request().query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM Afiliados');
  const nextId = maxIdRes.recordset[0].nextId;

  const rs = await pool.request()
    .input('Id', db.sql.Int, nextId)
    .input('Documento', db.sql.VarChar(20), a.Documento)
    .input('PrimerNombre', db.sql.VarChar(30), a.PrimerNombre)
    .input('SegundoNombre', db.sql.VarChar(30), a.SegundoNombre || null)
    .input('PrimerApellido', db.sql.VarChar(30), a.PrimerApellido)
    .input('SegundoApellido', db.sql.VarChar(30), a.SegundoApellido || null)
    .input('Ciudad', db.sql.VarChar(50), a.Ciudad || null)
    .input('Localidad', db.sql.VarChar(50), a.Localidad || null)
    .input('Domicilio', db.sql.VarChar(150), a.Domicilio || null)
    .input('FechaNacimiento', db.sql.Date, a.FechaNacimiento || null)
    .input('Sexo', db.sql.Char(20), a.Sexo || null)
    .input('Mail', db.sql.VarChar(100), a.Mail || null)
    .input('Observacion', db.sql.VarChar(1000), a.Observacion || null)
    .input('CodigoPostal', db.sql.Char(20), a.CodigoPostal || null)
    .input('Departamento', db.sql.Char(20), a.Departamento || null)
    .input('EstadoCivil', db.sql.Char(20), a.EstadoCivil || null)
    .input('Celular', db.sql.Char(20), a.Celular || null)
    .input('Telefono', db.sql.Char(20), a.Telefono || null)
    .input('TelefonoTrabajo', db.sql.Char(20), a.TelefonoTrabajo || null)
    .input('NroFuncionario', db.sql.VarChar(20), a.NroFuncionario || null)
    .input('Cargo', db.sql.VarChar(100), a.Cargo || null)
    .input('Sector', db.sql.VarChar(100), a.Sector || null)
    .input('Turno', db.sql.VarChar(50), a.Turno || null)
    .input('FechaIngreso', db.sql.Date, a.FechaIngreso || null)
    .input('IdCategoria', db.sql.Int, a.IdCategoria || null)
    .input('IdUbicacion', db.sql.Int, a.IdUbicacion || null)
    .input('Banco', db.sql.NVarChar(100), a.Banco || null)
    .input('NroCuenta', db.sql.NVarChar(50), a.NroCuenta || null)
    .input('EmpresaEnvio', db.sql.NVarChar(100), a.EmpresaEnvio || null)
    .query(`
      INSERT INTO Afiliados (
        Id, Documento, PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido,
        Ciudad, Localidad, Domicilio, FechaNacimiento, Sexo, Mail, Observacion,
        CodigoPostal, Departamento, EstadoCivil, Celular, Telefono, TelefonoTrabajo,
        NroFuncionario, Cargo, Sector, Turno, FechaIngreso, IdCategoria, IdUbicacion,Banco, NroCuenta, EmpresaEnvio,
        FechaAlta, Activo
      )
      OUTPUT INSERTED.Id
      VALUES (
        @Id, @Documento, @PrimerNombre, @SegundoNombre, @PrimerApellido, @SegundoApellido,
        @Ciudad, @Localidad, @Domicilio, @FechaNacimiento, @Sexo, @Mail, @Observacion,
        @CodigoPostal, @Departamento, @EstadoCivil, @Celular, @Telefono, @TelefonoTrabajo,
        @NroFuncionario, @Cargo, @Sector, @Turno, @FechaIngreso, @IdCategoria, @IdUbicacion,@Banco, @NroCuenta, @EmpresaEnvio,
        GETDATE(), 1
      )
    `);
  return rs.recordset[0].Id;
};

const update = async function (id, a) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('Id', db.sql.Int, id)
    .input('Documento', db.sql.VarChar(20), a.Documento)
    .input('PrimerNombre', db.sql.VarChar(30), a.PrimerNombre)
    .input('SegundoNombre', db.sql.VarChar(30), a.SegundoNombre || null)
    .input('PrimerApellido', db.sql.VarChar(30), a.PrimerApellido)
    .input('SegundoApellido', db.sql.VarChar(30), a.SegundoApellido || null)
    .input('Ciudad', db.sql.VarChar(50), a.Ciudad || null)
    .input('Localidad', db.sql.VarChar(50), a.Localidad || null)
    .input('Domicilio', db.sql.VarChar(150), a.Domicilio || null)
    .input('FechaNacimiento', db.sql.Date, a.FechaNacimiento || null)
    .input('FechaFallecimiento', db.sql.Date, a.FechaFallecimiento || null)
    .input('Sexo', db.sql.Char(20), a.Sexo || null)
    .input('Mail', db.sql.VarChar(100), a.Mail || null)
    .input('Observacion', db.sql.VarChar(1000), a.Observacion || null)
    .input('CodigoPostal', db.sql.Char(20), a.CodigoPostal || null)
    .input('Departamento', db.sql.Char(20), a.Departamento || null)
    .input('EstadoCivil', db.sql.Char(20), a.EstadoCivil || null)
    .input('Celular', db.sql.Char(20), a.Celular || null)
    .input('Telefono', db.sql.Char(20), a.Telefono || null)
    .input('TelefonoTrabajo', db.sql.Char(20), a.TelefonoTrabajo || null)
    .input('NroFuncionario', db.sql.VarChar(20), a.NroFuncionario || null)
    .input('Cargo', db.sql.VarChar(100), a.Cargo || null)
    .input('Sector', db.sql.VarChar(100), a.Sector || null)
    .input('Turno', db.sql.VarChar(50), a.Turno || null)
    .input('FechaIngreso', db.sql.Date, a.FechaIngreso || null)
    .input('IdCategoria', db.sql.Int, a.IdCategoria || null)
    .input('IdUbicacion', db.sql.Int, a.IdUbicacion || null)
    .input('Banco', db.sql.NVarChar(100), a.Banco || null)
    .input('NroCuenta', db.sql.NVarChar(50), a.NroCuenta || null)
    .input('EmpresaEnvio', db.sql.NVarChar(100), a.EmpresaEnvio || null)
    .query(`
      UPDATE Afiliados SET
        Documento               = @Documento,
        PrimerNombre            = @PrimerNombre,
        SegundoNombre           = @SegundoNombre,
        PrimerApellido          = @PrimerApellido,
        SegundoApellido         = @SegundoApellido,
        Ciudad                  = @Ciudad,
        Localidad               = @Localidad,
        Domicilio               = @Domicilio,
        FechaNacimiento         = @FechaNacimiento,
        FechaFallecimiento      = @FechaFallecimiento,
        Sexo                    = @Sexo,
        Mail                    = @Mail,
        Observacion             = @Observacion,
        CodigoPostal            = @CodigoPostal,
        Departamento            = @Departamento,
        EstadoCivil             = @EstadoCivil,
        Celular                 = @Celular,
        Telefono                = @Telefono,
        TelefonoTrabajo         = @TelefonoTrabajo,
        NroFuncionario          = @NroFuncionario,
        Cargo                   = @Cargo,
        Sector                  = @Sector,
        Turno                   = @Turno,
        FechaIngreso            = @FechaIngreso,
        IdCategoria             = @IdCategoria,
        IdUbicacion             = @IdUbicacion,
        Banco                   = @Banco,
        NroCuenta               = @NroCuenta,
        EmpresaEnvio            = @EmpresaEnvio,
        FechaUltimaModificacion = GETDATE()
      WHERE Id = @Id AND Activo = 1
    `);
  return rs.rowsAffected[0];
};

const remove = async function (id, idMotivo, observaciones) {
  const pool = await db.getConnection();

  // Registrar en AfiliadosBajados
  const maxIdRes = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM AfiliadosBajados');
  const nextId = maxIdRes.recordset[0].nextId;

  await pool.request()
    .input('id', nextId)
    .input('idAfiliado', id)
    .input('idMotivo', idMotivo)
    .input('observaciones', observaciones || null)
    .query(`
      INSERT INTO AfiliadosBajados (Id, IdAfiliado, IdMotivo, FechaBaja, Observaciones)
      VALUES (@id, @idAfiliado, @idMotivo, GETDATE(), @observaciones)
    `);

  // Dar de baja en Afiliados
  const rs = await pool.request()
    .input('Id', db.sql.Int, id)
    .query('UPDATE Afiliados SET Activo = 0, FechaBaja = GETDATE() WHERE Id = @Id AND Activo = 1');
  return rs.rowsAffected[0];
};

const search = async function (texto) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('texto', `%${texto}%`)
    .query(`
      SELECT TOP 10 Id, Documento, PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido, NroFuncionario, Cargo, Sector
      FROM Afiliados
      WHERE Activo = 1
        AND (
          PrimerNombre LIKE @texto OR
          PrimerApellido LIKE @texto OR
          SegundoApellido LIKE @texto OR
          Documento LIKE @texto OR
          NroFuncionario LIKE @texto
        )
      ORDER BY PrimerApellido, PrimerNombre
    `);
  return rs.recordset;
};

const reactivar = async function (id) {
  const pool = await db.getConnection();

  // Eliminar registro de AfiliadosBajados
  await pool.request()
    .input('id', id)
    .query('DELETE FROM AfiliadosBajados WHERE IdAfiliado = @id');

  // Reactivar
  const rs = await pool.request()
    .input('id', id)
    .query('UPDATE Afiliados SET Activo = 1, FechaBaja = NULL WHERE Id = @id AND Activo = 0');
  return rs.rowsAffected[0];
};

module.exports = { getAll, getById, create, update, remove, search, reactivar };
