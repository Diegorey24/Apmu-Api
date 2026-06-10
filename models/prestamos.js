const db = require('../helpers/db');

const getAll = async function (filtros = {}) {
  const pool = await db.getConnection();
  let query = `
    SELECT 
      pc.Id, pc.FechaPrestamo, pc.Estado,
      a.Id AS IdAfiliado,
      a.PrimerNombre + ' ' + a.PrimerApellido + 
        ISNULL(' ' + a.SegundoApellido, '') AS NombreAfiliado,
      a.Documento,
      COUNT(pl.Id) AS CantLibros,
      SUM(CASE WHEN pl.FechaDevolucion IS NOT NULL THEN 1 ELSE 0 END) AS CantDevueltos
    FROM PrestamoCabezal pc
    INNER JOIN Afiliados a ON pc.IdAfiliado = a.Id
    LEFT JOIN PrestamoLinea pl ON pl.IdPrestamo = pc.Id
    WHERE 1=1
  `;
  const request = pool.request();

  if (filtros.estado) {
    query += ' AND pc.Estado = @estado';
    request.input('estado', filtros.estado);
  }
  if (filtros.idAfiliado) {
    query += ' AND pc.IdAfiliado = @idAfiliado';
    request.input('idAfiliado', filtros.idAfiliado);
  }

  query += ' GROUP BY pc.Id, pc.FechaPrestamo, pc.Estado, a.Id, a.PrimerNombre, a.PrimerApellido, a.SegundoApellido, a.Documento';
  query += ' ORDER BY pc.FechaPrestamo DESC';

  const rs = await request.query(query);
  return rs.recordset;
};

const getById = async function (id) {
  const pool = await db.getConnection();

  // Cabezal
  const cabezal = await pool.request()
    .input('id', id)
    .query(`
      SELECT 
        pc.Id, pc.FechaPrestamo, pc.Estado,
        a.Id AS IdAfiliado,
        a.PrimerNombre + ' ' + a.PrimerApellido +
          ISNULL(' ' + a.SegundoApellido, '') AS NombreAfiliado,
        a.Documento
      FROM PrestamoCabezal pc
      INNER JOIN Afiliados a ON pc.IdAfiliado = a.Id
      WHERE pc.Id = @id
    `);

  if (!cabezal.recordset[0]) return null;

  // Líneas
  const lineas = await pool.request()
    .input('id', id)
    .query(`
      SELECT 
        pl.Id, pl.IdLibro, pl.FechaPrestamo, pl.FechaVencimiento, pl.FechaDevolucion,
        l.Nombre AS NombreLibro, l.ISBN, l.Tipo
      FROM PrestamoLinea pl
      INNER JOIN Libros l ON pl.IdLibro = l.Id
      WHERE pl.IdPrestamo = @id
      ORDER BY pl.Id
    `);

  return { ...cabezal.recordset[0], lineas: lineas.recordset };
};

const create = async function (idAfiliado, lineas) {
  // lineas = [{ idLibro, fechaVencimiento }]
  const pool = await db.getConnection();

  // Verificar stock de cada libro
  for (const linea of lineas) {
    const stockRes = await pool.request()
      .input('id', linea.idLibro)
      .query('SELECT Stock, Nombre FROM Libros WHERE Id = @id AND FechaBaja IS NULL');
    if (!stockRes.recordset[0]) throw new Error(`Libro no encontrado`);
    if (stockRes.recordset[0].Stock < 1) {
      throw new Error(`Sin stock disponible: "${stockRes.recordset[0].Nombre}"`);
    }
  }

  // Crear cabezal
  const maxIdCab = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM PrestamoCabezal');
  const idCabezal = maxIdCab.recordset[0].nextId;

  await pool.request()
    .input('id', idCabezal)
    .input('idAfiliado', idAfiliado)
    .query(`INSERT INTO PrestamoCabezal (Id, IdAfiliado, FechaPrestamo, Estado)
        VALUES (@id, @idAfiliado, GETDATE(), 'Activo')`);

  // Crear líneas y descontar stock
  const maxIdLinea = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) AS maxId FROM PrestamoLinea');
  let nextIdLinea = maxIdLinea.recordset[0].maxId + 1;

  for (const linea of lineas) {
    await pool.request()
      .input('id', nextIdLinea)
      .input('idPrestamo', idCabezal)
      .input('idLibro', linea.idLibro)
      .input('fechaVencimiento', linea.fechaVencimiento || null)
    .query(`INSERT INTO PrestamoLinea (Id, IdPrestamo, IdLibro, FechaPrestamo, FechaVencimiento)
        VALUES (@id, @idPrestamo, @idLibro, GETDATE(), @fechaVencimiento)`);

    await pool.request()
      .input('id', linea.idLibro)
      .query('UPDATE Libros SET Stock = Stock - 1 WHERE Id = @id');

    nextIdLinea++;
  }

  return idCabezal;
};

const devolver = async function (idLinea) {
  const pool = await db.getConnection();

  // Verificar que no esté ya devuelta
  const lineaRes = await pool.request()
    .input('id', idLinea)
    .query('SELECT IdPrestamo, IdLibro, FechaDevolucion FROM PrestamoLinea WHERE Id = @id');
  const linea = lineaRes.recordset[0];
  if (!linea) throw new Error('Línea no encontrada');
  if (linea.FechaDevolucion) throw new Error('Este libro ya fue devuelto');

  // Registrar devolución
  await pool.request()
    .input('id', idLinea)
    .query('UPDATE PrestamoLinea SET FechaDevolucion = GETDATE() WHERE Id = @id');

  // Sumar stock
  await pool.request()
    .input('id', linea.IdLibro)
    .query('UPDATE Libros SET Stock = Stock + 1 WHERE Id = @id');

  // Recalcular estado del cabezal
  await recalcularEstado(pool, linea.IdPrestamo);
};

const recalcularEstado = async function (pool, idPrestamo) {
  const rs = await pool.request()
    .input('id', idPrestamo)
    .query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN FechaDevolucion IS NOT NULL THEN 1 ELSE 0 END) AS devueltos,
        SUM(CASE WHEN FechaDevolucion IS NULL AND FechaVencimiento < GETDATE() THEN 1 ELSE 0 END) AS vencidos
      FROM PrestamoLinea WHERE IdPrestamo = @id
    `);
  const { total, devueltos, vencidos } = rs.recordset[0];

  let estado = 'Activo';
  if (devueltos === total) estado = 'Devuelto';
  else if (vencidos > 0) estado = 'Vencido';

  await pool.request()
    .input('id', idPrestamo)
    .input('estado', estado)
    .query('UPDATE PrestamoCabezal SET Estado = @estado WHERE Id = @id');
};

module.exports = { getAll, getById, create, devolver };