const db = require('../helpers/db');
const configuracionModel = require('./configuracion');
const { calcularEdadAlCorte } = require('./hijos');

const getAll = async function (filtros = {}) {
    const pool = await db.getConnection();
    let query = `
    SELECT b.*,
      a.PrimerNombre + ' ' + a.PrimerApellido + ISNULL(' ' + a.SegundoApellido, '') AS NombreAfiliado,
      a.Documento,
      h.PrimerNombre + ' ' + h.PrimerApellido AS NombreHijo
    FROM Beneficios b
    INNER JOIN Afiliados a ON b.IdAfiliado = a.Id
    LEFT JOIN Hijos h ON b.IdHijo = h.Id
    WHERE 1=1
  `;
    const request = pool.request();

    if (filtros.tipo) {
        query += ' AND b.Tipo = @tipo';
        request.input('tipo', filtros.tipo);
    }
    if (filtros.anio) {
        query += ' AND b.Anio = @anio';
        request.input('anio', filtros.anio);
    }
    if (filtros.idAfiliado) {
        query += ' AND b.IdAfiliado = @idAfiliado';
        request.input('idAfiliado', filtros.idAfiliado);
    }

    query += ' ORDER BY b.FechaEntrega DESC';
    const rs = await request.query(query);
    return rs.recordset;
};

const verificarDuplicado = async function (idAfiliado, idHijo, tipo, anio) {
    const pool = await db.getConnection();
    let query = `
    SELECT COUNT(*) AS total FROM Beneficios
    WHERE IdAfiliado = @idAfiliado AND Tipo = @tipo AND Anio = @anio
  `;
    const request = pool.request()
        .input('idAfiliado', idAfiliado)
        .input('tipo', tipo)
        .input('anio', anio);

    if (idHijo) {
        query += ' AND IdHijo = @idHijo';
        request.input('idHijo', idHijo);
    }

    const rs = await request.query(query);
    return rs.recordset[0].total > 0;
};

const verificarPrestamosVencidos = async function (idAfiliado) {
    const pool = await db.getConnection();
    const rs = await pool.request()
        .input('idAfiliado', idAfiliado)
        .query(`
      SELECT COUNT(*) AS total
      FROM PrestamoCabezal
      WHERE IdAfiliado = @idAfiliado AND Estado = 'Vencido'
    `);
    return rs.recordset[0].total > 0;
};

const create = async function (data) {
    const pool = await db.getConnection();
    const maxIdRes = await pool.request()
        .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM Beneficios');
    const nextId = maxIdRes.recordset[0].nextId;
    await pool.request()
        .input('id', nextId)
        .input('idAfiliado', data.idAfiliado)
        .input('idHijo', data.idHijo || null)
        .input('tipo', data.tipo)
        .input('anio', data.anio)
        .input('fechaEntrega', data.fechaEntrega)
        .input('observaciones', data.observaciones || null)
        .input('usuario', data.usuario || null)
        .query(`
      INSERT INTO Beneficios (Id, IdAfiliado, IdHijo, Tipo, Anio, FechaEntrega, Observaciones, Usuario)
      VALUES (@id, @idAfiliado, @idHijo, @tipo, @anio, @fechaEntrega, @observaciones, @usuario)
    `);
    return nextId;
};

const remove = async function (id) {
    const pool = await db.getConnection();
    await pool.request()
        .input('id', id)
        .query('DELETE FROM Beneficios WHERE Id = @id');
};

const getListadoCanastas = async function () {
    const pool = await db.getConnection();
    const rs = await pool.request().query(`
      SELECT
        a.NroFuncionario, a.Documento, a.PrimerNombre, a.PrimerApellido,
        a.PrimerNombre + ' ' + a.PrimerApellido + ISNULL(' ' + a.SegundoApellido, '') AS NombreCompleto,
        a.IdUbicacion,
        u.Nombre AS Ubicacion,
        CASE WHEN EXISTS (
          SELECT 1 FROM PrestamoCabezal pc
          INNER JOIN PrestamoLinea pl ON pl.IdPrestamo = pc.Id
          WHERE pc.IdAfiliado = a.Id AND pl.FechaDevolucion IS NULL AND pl.FechaVencimiento < GETDATE()
        ) THEN 1 ELSE 0 END AS DeudaLibros
      FROM Afiliados a
      LEFT JOIN Ubicaciones u ON a.IdUbicacion = u.Id
      WHERE a.Activo = 1
      ORDER BY a.PrimerApellido, a.PrimerNombre
    `);
    return rs.recordset;
};

const getListadoUtiles = async function () {
    const pool = await db.getConnection();
    const rs = await pool.request().query(`
      SELECT
        a.NroFuncionario, a.Documento, a.PrimerNombre, a.PrimerApellido,
        a.PrimerNombre + ' ' + a.PrimerApellido + ISNULL(' ' + a.SegundoApellido, '') AS NombreSocio,
        a.IdUbicacion,
        u.Nombre AS Ubicacion,
        h.PrimerNombre AS NombreHijo,
        h.FechaNacimiento, h.Sexo, h.Discapacidad
      FROM Afiliados a
      INNER JOIN Hijos h ON h.IdAfiliado = a.Id
      LEFT JOIN Ubicaciones u ON a.IdUbicacion = u.Id
      WHERE a.Activo = 1 AND h.FechaNacimiento IS NOT NULL
      ORDER BY a.PrimerApellido, a.PrimerNombre
    `);

    const fechaCorte = (await configuracionModel.getByClave('FechaCorteHijos')) || '04-30';
    return rs.recordset
        .map(r => ({ ...r, Edad: calcularEdadAlCorte(r.FechaNacimiento, fechaCorte) }))
        .filter(r => r.Edad >= 3 && (r.Discapacidad ? r.Edad <= 21 : r.Edad <= 18));
};

module.exports = { getAll, verificarDuplicado, verificarPrestamosVencidos, create, remove, getListadoCanastas, getListadoUtiles };