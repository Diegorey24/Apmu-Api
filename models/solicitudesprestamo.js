const db = require('../helpers/db');

const getAll = async function (filtros = {}) {
    const pool = await db.getConnection();
    let query = `
    SELECT sp.*,
      a.PrimerNombre + ' ' + a.PrimerApellido + ISNULL(' ' + a.SegundoApellido, '') AS NombreAfiliado,
      a.Documento,
      l.Nombre AS NombreLibro, l.Tipo, l.Stock
    FROM SolicitudesPrestamo sp
    INNER JOIN Afiliados a ON sp.IdAfiliado = a.Id
    INNER JOIN Libros l ON sp.IdLibro = l.Id
    WHERE 1=1
  `;
    const request = pool.request();

    if (filtros.estado) {
        query += ' AND sp.Estado = @estado';
        request.input('estado', filtros.estado);
    }

    query += ' ORDER BY sp.FechaSolicitud DESC';
    const rs = await request.query(query);
    return rs.recordset;
};

const getByAfiliado = async function (idAfiliado) {
    const pool = await db.getConnection();
    const rs = await pool.request()
        .input('id', idAfiliado)
        .query(`
      SELECT sp.*, l.Nombre AS NombreLibro, l.Tipo
      FROM SolicitudesPrestamo sp
      INNER JOIN Libros l ON sp.IdLibro = l.Id
      WHERE sp.IdAfiliado = @id
      ORDER BY sp.FechaSolicitud DESC
    `);
    return rs.recordset;
};

const create = async function (idAfiliado, idLibro) {
    const pool = await db.getConnection();

    // Verificar que no tenga una solicitud pendiente del mismo libro
    const existe = await pool.request()
        .input('idAfiliado', idAfiliado)
        .input('idLibro', idLibro)
        .query(`
      SELECT COUNT(*) AS total FROM SolicitudesPrestamo
      WHERE IdAfiliado = @idAfiliado AND IdLibro = @idLibro AND Estado = 'Pendiente'
    `);
    if (existe.recordset[0].total > 0) {
        throw new Error('Ya tenés una solicitud pendiente para este libro');
    }

    const maxIdRes = await pool.request()
        .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM SolicitudesPrestamo');
    const nextId = maxIdRes.recordset[0].nextId;

    await pool.request()
        .input('id', nextId)
        .input('idAfiliado', idAfiliado)
        .input('idLibro', idLibro)
        .query(`
      INSERT INTO SolicitudesPrestamo (Id, IdAfiliado, IdLibro)
      VALUES (@id, @idAfiliado, @idLibro)
    `);
    return nextId;
};

const resolver = async function (id, estado, usuarioResolucion, observaciones) {
    const pool = await db.getConnection();
    await pool.request()
        .input('id', id)
        .input('estado', estado)
        .input('usuario', usuarioResolucion)
        .input('observaciones', observaciones || null)
        .query(`
      UPDATE SolicitudesPrestamo SET
        Estado = @estado,
        FechaResolucion = GETDATE(),
        UsuarioResolucion = @usuario,
        Observaciones = @observaciones
      WHERE Id = @id
    `);
};

module.exports = { getAll, getByAfiliado, create, resolver };