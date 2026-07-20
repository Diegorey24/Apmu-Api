const db = require('../helpers/db');
const PDFDocument = require('pdfkit');

const getAll = async function (filtros = {}) {
  const pool = await db.getConnection();
  const page = filtros.page || 1;
  const limit = filtros.limit || 20;
  const offset = (page - 1) * limit;

  let where = '';
  const request = pool.request();

  if (filtros.estado) {
    where += ' AND pc.Estado = @estado';
    request.input('estado', filtros.estado);
  }
  if (filtros.idAfiliado) {
    where += ' AND pc.IdAfiliado = @idAfiliado';
    request.input('idAfiliado', filtros.idAfiliado);
  }

  request.input('offset', offset);
  request.input('limit', limit);

  const rs = await request.query(`
    SELECT *, COUNT(*) OVER() AS TotalRecords FROM (
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
      WHERE 1=1 ${where}
      GROUP BY pc.Id, pc.FechaPrestamo, pc.Estado, a.Id, a.PrimerNombre, a.PrimerApellido, a.SegundoApellido, a.Documento
    ) sub
    ORDER BY FechaPrestamo DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  const total = rs.recordset.length > 0 ? rs.recordset[0].TotalRecords : 0;
  const data = rs.recordset.map(({ TotalRecords, ...row }) => row);
  return { data, total, page, limit };
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
        a.Documento,
        a.NroFuncionario
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

  // Cobro de libros de estudio ($200 c/u)
  const librosEstudio = await pool.request()
    .input('idPrestamo', idCabezal)
    .query(`
      SELECT COUNT(*) AS cant FROM PrestamoLinea pl
      INNER JOIN Libros l ON pl.IdLibro = l.Id
      WHERE pl.IdPrestamo = @idPrestamo AND l.Tipo = 'Estudio'
    `);
  const cantEstudio = librosEstudio.recordset[0].cant;
  if (cantEstudio > 0) {
    const importeTotal = cantEstudio * 200;
    const cajaModel = require('./cajachica');
    await cajaModel.create({
      fecha: new Date(),
      tipo: 'Entrada',
      descripcion: `Cobro préstamo #${idCabezal} — ${cantEstudio} libro(s) de estudio`,
      importe: importeTotal,
      usuario: 'sistema',
    });
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

const generarPDF = async (req, res) => {
  try {
    const data = await model.getById(req.params.id);
    if (!data) return res.status(404).send({ error: true, message: 'Préstamo no encontrado' });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=prestamo_${data.Id}.pdf`);
    doc.pipe(res);

    // Encabezado
    doc.fontSize(18).text('APMU — Comprobante de Préstamo', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text('Asociación del Personal de Médica Uruguaya', { align: 'center' });
    doc.moveDown(1.5);

    // Datos del préstamo
    doc.fontSize(12).text(`Préstamo Nº: ${data.Id}`);
    doc.text(`Fecha: ${data.FechaPrestamo ? data.FechaPrestamo.toISOString().substring(0, 10).split('-').reverse().join('/') : ''}`);
    doc.moveDown(0.5);

    // Datos del afiliado
    doc.text(`Afiliado: ${data.NombreAfiliado}`);
    doc.text(`Documento: ${data.Documento}`);
    doc.moveDown(1);

    // Tabla de libros
    doc.fontSize(12).text('Detalle de libros:', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const col1 = 50, col2 = 300, col3 = 420;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Libro', col1, tableTop);
    doc.text('Tipo', col2, tableTop);
    doc.text('Vencimiento', col3, tableTop);
    doc.moveTo(col1, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    doc.font('Helvetica');
    let y = tableTop + 22;
    data.lineas.forEach(l => {
      doc.text(l.NombreLibro, col1, y, { width: 240 });
      doc.text(l.Tipo || '—', col2, y);
      doc.text(l.FechaVencimiento ? l.FechaVencimiento.toISOString().substring(0, 10).split('-').reverse().join('/') : '—', col3, y);
      y += 20;
    });

    doc.moveDown(3);
    y = doc.y + 40;

    // Firma
    doc.moveTo(50, y).lineTo(250, y).stroke();
    doc.fontSize(10).text('Firma del afiliado', 50, y + 5);

    doc.moveTo(300, y).lineTo(500, y).stroke();
    doc.text('Firma del responsable', 300, y + 5);

    doc.end();
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, getById, create, devolver, generarPDF };