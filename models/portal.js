const db = require('../helpers/db');

const registrar = async function (documento, email, password) {
  const pool = await db.getConnection();

  const existe = await pool.request()
    .input('documento', documento)
    .query('SELECT Id FROM UsuariosPortal WHERE Documento = @documento');
  if (existe.recordset.length > 0) {
    throw new Error('Ya existe una solicitud con ese documento');
  }

  const maxId = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM UsuariosPortal');
  const nextId = maxId.recordset[0].nextId;

  const afiliado = await pool.request()
    .input('documento', documento)
    .query('SELECT Id FROM Afiliados WHERE Documento = @documento AND Activo = 1');
  const idAfiliado = afiliado.recordset[0]?.Id || null;

  await pool.request()
    .input('id', nextId)
    .input('documento', documento)
    .input('email', email || null)
    .input('password', password)
    .input('idAfiliado', idAfiliado)
    .query(`
      INSERT INTO UsuariosPortal (Id, Documento, Email, Password, Estado, IdAfiliado)
      VALUES (@id, @documento, @email, @password, 'Pendiente', @idAfiliado)
    `);

  return { id: nextId, afiliado: afiliado.recordset[0] || null };
};

const login = async function (documento, password) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('documento', documento)
    .query(`
      SELECT up.*, a.PrimerNombre, a.PrimerApellido, a.SegundoApellido
      FROM UsuariosPortal up
      LEFT JOIN Afiliados a ON up.IdAfiliado = a.Id
      WHERE up.Documento = @documento
    `);

  const usuario = rs.recordset[0];
  if (!usuario) throw new Error('Documento o contraseña incorrectos');
  if (usuario.Estado === 'Pendiente') throw new Error('Tu solicitud está pendiente de aprobación');
  if (usuario.Estado === 'Bloqueado') throw new Error('Tu acceso está bloqueado, contactá a APMU');
  if (password !== usuario.Password.trim()) throw new Error('Documento o contraseña incorrectos');

  return usuario;
};

const getPendientes = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query(`
    SELECT up.Id, up.Documento, up.Email, up.Estado, up.FechaRegistro, up.IdAfiliado,
      a.PrimerNombre, a.PrimerApellido, a.SegundoApellido, a.Activo
    FROM UsuariosPortal up
    LEFT JOIN Afiliados a ON up.Documento = a.Documento AND a.Activo = 1
    WHERE up.Estado = 'Pendiente'
    ORDER BY up.FechaRegistro DESC
  `);
  return rs.recordset;
};

const aprobar = async function (id, usuarioAdmin) {
  const pool = await db.getConnection();

  // Buscar el documento del usuario portal
  const usuarioRes = await pool.request()
    .input('id', id)
    .query('SELECT Documento FROM UsuariosPortal WHERE Id = @id');
  const usuario = usuarioRes.recordset[0];
  if (!usuario) throw new Error('Solicitud no encontrada');

  // Buscar afiliado por ese documento
  const afiliadoRes = await pool.request()
    .input('documento', usuario.Documento)
    .query('SELECT Id FROM Afiliados WHERE Documento = @documento AND Activo = 1');
  const afiliado = afiliadoRes.recordset[0];
  if (!afiliado) throw new Error('No existe un afiliado activo con ese documento. Agregalo primero en Afiliados.');

  await pool.request()
    .input('id', id)
    .input('idAfiliado', afiliado.Id)
    .input('usuario', usuarioAdmin)
    .query(`
      UPDATE UsuariosPortal SET
        Estado = 'Habilitado',
        IdAfiliado = @idAfiliado,
        FechaAprobacion = GETDATE(),
        UsuarioAprobacion = @usuario
      WHERE Id = @id
    `);
};

const rechazar = async function (id) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .query("UPDATE UsuariosPortal SET Estado = 'Bloqueado' WHERE Id = @id");
};

const getDatosAfiliado = async function (idAfiliado) {
  const pool = await db.getConnection();

  const afiliado = await pool.request()
    .input('id', idAfiliado)
    .query(`
      SELECT Id, Documento, PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido,
        Mail, Celular, Telefono, Departamento, Domicilio
      FROM Afiliados WHERE Id = @id
    `);

  const prestamos = await pool.request()
    .input('id', idAfiliado)
    .query(`
      SELECT pc.Id, pc.FechaPrestamo, pc.Estado,
        COUNT(pl.Id) AS CantLibros,
        SUM(CASE WHEN pl.FechaDevolucion IS NOT NULL THEN 1 ELSE 0 END) AS CantDevueltos
      FROM PrestamoCabezal pc
      LEFT JOIN PrestamoLinea pl ON pl.IdPrestamo = pc.Id
      WHERE pc.IdAfiliado = @id
      GROUP BY pc.Id, pc.FechaPrestamo, pc.Estado
      ORDER BY pc.FechaPrestamo DESC
    `);

  // Líneas de cada préstamo
  const lineas = await pool.request()
    .input('id', idAfiliado)
    .query(`
      SELECT pl.Id, pl.IdPrestamo, pl.FechaPrestamo, pl.FechaVencimiento, pl.FechaDevolucion,
        l.Nombre AS NombreLibro, l.Tipo, l.Costo
      FROM PrestamoLinea pl
      INNER JOIN PrestamoCabezal pc ON pl.IdPrestamo = pc.Id
      INNER JOIN Libros l ON pl.IdLibro = l.Id
      WHERE pc.IdAfiliado = @id
      ORDER BY pl.IdPrestamo, pl.Id
    `);

  // Adjuntar líneas a cada préstamo
  const prestamosConLineas = prestamos.recordset.map(p => ({
    ...p,
    lineas: lineas.recordset.filter(l => l.IdPrestamo === p.Id)
  }));

  const aportes = await pool.request()
    .input('id', idAfiliado)
    .query(`
      SELECT cc.Aniomes, r.RubDsc AS Rubro, cc.Importe, cc.NroRecibo, cc.FechaPago, cc.FormaPago,
        CASE WHEN cc.NroRecibo IS NOT NULL THEN 'Cobrado'
             WHEN cc.FechaVto < GETDATE() THEN 'Vencido'
             ELSE 'Pendiente' END AS Estado
      FROM CuentaCorriente cc
      LEFT JOIN Rubros r ON cc.Rubro = r.RubCod
      WHERE cc.IdAfiliado = @id
      ORDER BY cc.Aniomes DESC
    `);

  return {
    afiliado: afiliado.recordset[0],
    prestamos: prestamosConLineas,
    aportes: aportes.recordset,
  };
};

const cambiarPassword = async function (idAfiliado, passwordActual, passwordNueva) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('idAfiliado', idAfiliado)
    .query('SELECT Id, Password FROM UsuariosPortal WHERE IdAfiliado = @idAfiliado AND Estado = \'Habilitado\'');

  const usuario = rs.recordset[0];
  if (!usuario) throw new Error('Usuario no encontrado');
  if (passwordActual !== usuario.Password.trim()) throw new Error('La contraseña actual es incorrecta');

  await pool.request()
    .input('idAfiliado', idAfiliado)
    .input('password', passwordNueva)
    .query('UPDATE UsuariosPortal SET Password = @password WHERE IdAfiliado = @idAfiliado');
};

module.exports = { registrar, login, getPendientes, aprobar, rechazar, getDatosAfiliado, cambiarPassword };