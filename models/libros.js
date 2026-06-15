const db = require('../helpers/db');

const getAll = async function (filtros = {}) {
  const pool = await db.getConnection();
  let query = `
    SELECT l.*, e.Nombre AS NombreEditorial, m.Nombre AS NombreMateria
    FROM Libros l
    LEFT JOIN Editoriales e ON l.IdEditorial = e.Id
    LEFT JOIN Materias m ON l.IdMateria = m.Id
    WHERE 1=1
  `;
  const request = pool.request();

  if (filtros.tipo) {
    query += ' AND l.Tipo = @tipo';
    request.input('tipo', filtros.tipo);
  }
  if (filtros.idMateria) {
    query += ' AND l.IdMateria = @idMateria';
    request.input('idMateria', filtros.idMateria);
  }
  if (filtros.busqueda) {
    query += ' AND (l.Nombre LIKE @busqueda OR l.ISBN LIKE @busqueda)';
    request.input('busqueda', `%${filtros.busqueda}%`);
  }

  query += ' ORDER BY l.Nombre';
  const rs = await request.query(query);
  return rs.recordset;
};

const getById = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('id', id)
    .query(`
      SELECT l.*, e.Nombre AS NombreEditorial, m.Nombre AS NombreMateria
      FROM Libros l
      LEFT JOIN Editoriales e ON l.IdEditorial = e.Id
      LEFT JOIN Materias m ON l.IdMateria = m.Id
      WHERE l.Id = @id
    `);
  return rs.recordset[0];
};

const create = async function (data) {
  const pool = await db.getConnection();
  const maxIdRes = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM Libros');
  const nextId = maxIdRes.recordset[0].nextId;
  await pool.request()
    .input('id', nextId)
    .input('isbn', data.isbn || null)
    .input('nombre', data.nombre)
    .input('edicion', data.edicion || null)
    .input('idEditorial', data.idEditorial || null)
    .input('idMateria', data.tipo === 'Estudio' ? (data.idMateria || null) : null)
    .input('tipo', data.tipo)
    .input('material', data.material || null)
    .input('stock', data.stock || 0)
    .input('costo', data.tipo === 'Estudio' ? (data.costo || null) : null)
    .query(`
    INSERT INTO Libros (Id, ISBN, Nombre, Edicion, IdEditorial, IdMateria, Tipo, Material, Stock, Costo, FechaAlta)
    VALUES (@id, @isbn, @nombre, @edicion, @idEditorial, @idMateria, @tipo, @material, @stock, @costo, GETDATE())
    `);
  return nextId;
};

const update = async function (id, data) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .input('isbn', data.isbn || null)
    .input('nombre', data.nombre)
    .input('edicion', data.edicion || null)
    .input('idEditorial', data.idEditorial || null)
    .input('idMateria', data.tipo === 'Estudio' ? (data.idMateria || null) : null)
    .input('tipo', data.tipo)
    .input('material', data.material || null)
    .input('stock', data.stock)
    .input('costo', data.tipo === 'Estudio' ? (data.costo || null) : null)
    .query(`
      UPDATE Libros SET
        ISBN = @isbn, Nombre = @nombre, Edicion = @edicion,
        IdEditorial = @idEditorial, IdMateria = @idMateria,
        Tipo = @tipo, Material = @material, Stock = @stock, Costo = @costo
      WHERE Id = @id
    `);
};

const baja = async function (id) {
  const pool = await db.getConnection();
  // No dar de baja si tiene préstamos activos
  const check = await pool.request()
    .input('id', id)
    .query(`
      SELECT COUNT(*) AS total FROM PrestamoLinea pl
      INNER JOIN PrestamoCabezal pc ON pl.IdPrestamo = pc.Id
      WHERE pl.IdLibro = @id AND pc.Estado = 'Activo'
    `);
  if (check.recordset[0].total > 0) {
    throw new Error('No se puede dar de baja: el libro tiene préstamos activos');
  }
  await pool.request()
    .input('id', id)
    .input('fecha', new Date())
    .query('UPDATE Libros SET FechaBaja = @fecha WHERE Id = @id');
};

const alta = async function (id) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .query('UPDATE Libros SET FechaBaja = NULL WHERE Id = @id');
};

module.exports = { getAll, getById, create, update, baja, alta };