const db = require('../helpers/db');

const getDeudaAfiliado = async function (req, res) {
  try {
    const { idAfiliado } = req.params;
    const pool = await db.getConnection();

    // Datos del afiliado
    const afiliadoRes = await pool.request()
      .input('id', idAfiliado)
      .query(`
        SELECT Id, Documento, PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido
        FROM Afiliados WHERE Id = @id AND Activo = 1
      `);
    if (!afiliadoRes.recordset[0]) {
      return res.status(404).send({ error: true, message: 'Afiliado no encontrado' });
    }

    // Movimientos agrupados por período
    const movimientos = await pool.request()
      .input('id', idAfiliado)
      .query(`
        SELECT
          cc.Aniomes,
          r.RubDsc AS Rubro,
          cc.Importe,
          cc.FechaVto,
          cc.FechaPago,
          cc.NroRecibo,
          cc.FormaPago,
          CASE WHEN cc.NroRecibo IS NOT NULL THEN 'Pagado'
               WHEN cc.FechaVto < GETDATE() THEN 'Vencido'
               ELSE 'Pendiente'
          END AS Estado
        FROM CuentaCorriente cc
        LEFT JOIN Rubros r ON cc.Rubro = r.RubCod
        WHERE cc.IdAfiliado = @id
        ORDER BY cc.Aniomes DESC, r.RubDsc
      `);

    // Totales
    const totales = await pool.request()
      .input('id', idAfiliado)
      .query(`
        SELECT
          ISNULL(SUM(CASE WHEN NroRecibo IS NULL THEN Importe ELSE 0 END), 0) AS TotalDeuda,
          ISNULL(SUM(CASE WHEN NroRecibo IS NOT NULL THEN Importe ELSE 0 END), 0) AS TotalPagado,
          ISNULL(SUM(Importe), 0) AS TotalGeneral
        FROM CuentaCorriente WHERE IdAfiliado = @id
      `);

    res.status(200).send({
      error: false,
      data: {
        afiliado: afiliadoRes.recordset[0],
        movimientos: movimientos.recordset,
        totales: totales.recordset[0],
      }
    });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getConciliacion = async function (req, res) {
  try {
    const { aniomes, idRubro } = req.query;
    if (!aniomes || !idRubro) {
      return res.status(400).send({ error: true, message: 'Faltan parámetros' });
    }
    const pool = await db.getConnection();

    const rs = await pool.request()
      .input('aniomes', aniomes)
      .input('idRubro', idRubro)
      .query(`
        SELECT
          a.Id,
          a.Documento,
          a.PrimerNombre + ' ' + a.PrimerApellido + ISNULL(' ' + a.SegundoApellido, '') AS NombreAfiliado,
          CASE WHEN cc.Id IS NOT NULL THEN 1 ELSE 0 END AS TieneAporte,
          cc.Importe,
          cc.NroRecibo,
          cc.FechaPago
        FROM Afiliados a
        LEFT JOIN CuentaCorriente cc 
          ON cc.IdAfiliado = a.Id 
          AND cc.Aniomes = @aniomes 
          AND cc.Rubro = @idRubro
        WHERE a.Activo = 1
        ORDER BY a.PrimerApellido, a.PrimerNombre
      `);

    const todos = rs.recordset;
    const conAporte = todos.filter(r => r.TieneAporte === 1);
    const sinAporte = todos.filter(r => r.TieneAporte === 0);

    res.status(200).send({
      error: false,
      data: { todos, conAporte, sinAporte, total: todos.length, totalCon: conAporte.length, totalSin: sinAporte.length }
    });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const XLSX = require('xlsx');

const exportarAfiliados = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const pool = await db.getConnection();
    const request = pool.request();
    let where = '';
    if (fechaDesde) { where += ' AND a.FechaIngreso >= @fechaDesde'; request.input('fechaDesde', fechaDesde); }
    if (fechaHasta) { where += ' AND a.FechaIngreso <= @fechaHasta'; request.input('fechaHasta', fechaHasta); }

    const rs = await request.query(`
      SELECT 
        a.Id, a.Documento, a.NroFuncionario,
        a.PrimerNombre, a.SegundoNombre, a.PrimerApellido, a.SegundoApellido,
        a.FechaNacimiento, a.Sexo, a.EstadoCivil,
        a.Mail, a.Celular, a.Telefono,
        a.Domicilio, a.Ciudad, a.Departamento,
        a.Cargo, a.Sector, a.Turno, a.FechaIngreso,
        c.Nombre AS Categoria, u.Nombre AS Ubicacion,
        a.FechaAlta
      FROM Afiliados a
      LEFT JOIN Categorias c ON a.IdCategoria = c.Id
      LEFT JOIN Ubicaciones u ON a.IdUbicacion = u.Id
      WHERE a.Activo = 1 ${where}
      ORDER BY a.PrimerApellido, a.PrimerNombre
    `);

    const ws = XLSX.utils.json_to_sheet(rs.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Afiliados');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=padron_afiliados.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const exportarBajas = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const pool = await db.getConnection();
    const request = pool.request();
    let where = '';
    if (fechaDesde) { where += ' AND ab.FechaBaja >= @fechaDesde'; request.input('fechaDesde', fechaDesde); }
    if (fechaHasta) { where += ' AND ab.FechaBaja <= @fechaHasta'; request.input('fechaHasta', fechaHasta); }

    const rs = await request.query(`
      SELECT 
        a.Documento, a.NroFuncionario,
        a.PrimerNombre, a.PrimerApellido, a.SegundoApellido,
        mb.Nombre AS Motivo, ab.FechaBaja, ab.Observaciones
      FROM AfiliadosBajados ab
      INNER JOIN Afiliados a ON ab.IdAfiliado = a.Id
      INNER JOIN MotivosBaja mb ON ab.IdMotivo = mb.Id
      WHERE 1=1 ${where}
      ORDER BY ab.FechaBaja DESC
    `);

    const ws = XLSX.utils.json_to_sheet(rs.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bajas');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=afiliados_bajas.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const exportarAportes = async (req, res) => {
  try {
    const { aniomes } = req.query;
    const pool = await db.getConnection();
    const request = pool.request();
    let where = '';
    if (aniomes) {
      where = 'AND cc.Aniomes = @aniomes';
      request.input('aniomes', aniomes);
    }
    const rs = await request.query(`
      SELECT 
        a.Documento, a.NroFuncionario,
        a.PrimerNombre + ' ' + a.PrimerApellido AS Nombre,
        r.RubDsc AS Rubro, cc.Importe, cc.Aniomes AS Periodo,
        cc.NroRecibo, cc.FechaPago, cc.FormaPago,
        CASE WHEN cc.NroRecibo IS NOT NULL THEN 'Cobrado'
             WHEN cc.FechaVto < GETDATE() THEN 'Vencido'
             ELSE 'Pendiente' END AS Estado
      FROM CuentaCorriente cc
      INNER JOIN Afiliados a ON cc.IdAfiliado = a.Id
      LEFT JOIN Rubros r ON cc.Rubro = r.RubCod
      WHERE 1=1 ${where}
      ORDER BY cc.Aniomes DESC, a.PrimerApellido
    `);

    const ws = XLSX.utils.json_to_sheet(rs.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Aportes');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = aniomes ? `aportes_${aniomes}.xlsx` : 'aportes.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const exportarPrestamos = async (req, res) => {
  try {
    const pool = await db.getConnection();
    const rs = await pool.request().query(`
      SELECT 
        pc.Id AS NroPrestamo, pc.FechaPrestamo, pc.Estado,
        a.Documento, a.PrimerNombre + ' ' + a.PrimerApellido AS Afiliado,
        l.Nombre AS Libro, l.Tipo,
        pl.FechaVencimiento, pl.FechaDevolucion
      FROM PrestamoCabezal pc
      INNER JOIN Afiliados a ON pc.IdAfiliado = a.Id
      INNER JOIN PrestamoLinea pl ON pl.IdPrestamo = pc.Id
      INNER JOIN Libros l ON pl.IdLibro = l.Id
      ORDER BY pc.FechaPrestamo DESC
    `);

    const ws = XLSX.utils.json_to_sheet(rs.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prestamos');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=prestamos.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const exportarLicencias = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const pool = await db.getConnection();
    const request = pool.request();
    let where = '';
    if (fechaDesde) { where += ' AND lg.FechaLicencia >= @fechaDesde'; request.input('fechaDesde', fechaDesde); }
    if (fechaHasta) { where += ' AND lg.FechaLicencia <= @fechaHasta'; request.input('fechaHasta', fechaHasta); }

    const rs = await request.query(`
      SELECT 
        a.NroFuncionario, a.Documento,
        a.PrimerNombre + ' ' + a.PrimerApellido AS Nombre,
        a.Cargo, a.Sector,
        lg.Horario, lg.FechaLicencia, lg.SolicitadaPor,
        lg.PedidaPor, lg.Convocatoria, lg.Comision
      FROM LicenciasGremiales lg
      INNER JOIN Afiliados a ON lg.IdAfiliado = a.Id
      WHERE 1=1 ${where}
      ORDER BY lg.FechaLicencia DESC
    `);

    const ws = XLSX.utils.json_to_sheet(rs.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Licencias');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=licencias_gremiales.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const exportarDeudoresLibros = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const pool = await db.getConnection();
    const request = pool.request();
    let where = '';
    if (fechaDesde) { where += ' AND pl.FechaVencimiento >= @fechaDesde'; request.input('fechaDesde', fechaDesde); }
    if (fechaHasta) { where += ' AND pl.FechaVencimiento <= @fechaHasta'; request.input('fechaHasta', fechaHasta); }

    const rs = await request.query(`
      SELECT
        pc.Id AS NroPrestamo,
        a.Documento, a.NroFuncionario,
        a.PrimerNombre + ' ' + a.PrimerApellido AS Afiliado,
        a.Telefono,
        l.Nombre AS Libro,
        pl.FechaPrestamo, pl.FechaVencimiento,
        DATEDIFF(day, pl.FechaVencimiento, GETDATE()) AS DiasAtraso
      FROM PrestamoLinea pl
      INNER JOIN PrestamoCabezal pc ON pl.IdPrestamo = pc.Id
      INNER JOIN Afiliados a ON pc.IdAfiliado = a.Id
      INNER JOIN Libros l ON pl.IdLibro = l.Id
      WHERE pl.FechaDevolucion IS NULL AND pl.FechaVencimiento < GETDATE() ${where}
      ORDER BY pl.FechaVencimiento ASC
    `);

    const ws = XLSX.utils.json_to_sheet(rs.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Deudores');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=deudores_libros.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const exportarListadoLibros = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    const pool = await db.getConnection();
    const request = pool.request();
    let where = '';
    if (fechaDesde) { where += ' AND l.FechaAlta >= @fechaDesde'; request.input('fechaDesde', fechaDesde); }
    if (fechaHasta) { where += ' AND l.FechaAlta <= @fechaHasta'; request.input('fechaHasta', fechaHasta); }

    const rs = await request.query(`
      SELECT
        l.Nombre, l.Autor, l.ISBN, l.Edicion, l.Tipo,
        e.Nombre AS Editorial, m.Nombre AS Materia, l.Grado, l.Material,
        l.Stock, l.Costo, l.FechaAlta,
        CASE WHEN l.FechaBaja IS NULL THEN 'Activo' ELSE 'Baja' END AS Estado
      FROM Libros l
      LEFT JOIN Editoriales e ON l.IdEditorial = e.Id
      LEFT JOIN Materias m ON l.IdMateria = m.Id
      WHERE 1=1 ${where}
      ORDER BY l.Nombre
    `);

    const ws = XLSX.utils.json_to_sheet(rs.recordset);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Libros');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=listado_libros.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = {
  getDeudaAfiliado, getConciliacion, exportarAfiliados, exportarBajas, exportarAportes,
  exportarPrestamos, exportarLicencias, exportarDeudoresLibros, exportarListadoLibros,
};