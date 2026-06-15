const db = require('../helpers/db');
const getAll = async function (filtros = {}) {
  const pool = await db.getConnection();

  let where = ' WHERE 1=1';
  const request = pool.request();

  if (filtros.estado) {
    where += ' AND c.Estado = @estado';
    request.input('estado', filtros.estado);
  }
  if (filtros.clienteId) {
    where += ' AND c.Cliente_Id = @clienteId';
    request.input('clienteId', filtros.clienteId);
  }
  if (filtros.busqueda) {
    where += ' AND (CAST(c.Numero AS VARCHAR) LIKE @busqueda OR CAST(c.Cliente_Id AS VARCHAR) LIKE @busqueda)';
    request.input('busqueda', `%${filtros.busqueda}%`);
  }

  // Total
  const countResult = await request.query(`
    SELECT COUNT(*) AS total
    FROM Creditos c
    LEFT JOIN ClientesHistorico ch ON c.Cliente_Id = ch.Id
    ${where}
  `);
  const total = countResult.recordset[0].total;

  // Datos paginados
  const page = parseInt(filtros.page) || 1;
  const limit = parseInt(filtros.limit) || 20;
  const offset = (page - 1) * limit;

  const dataResult = await request.query(`
    SELECT 
      c.Id, c.Numero, c.Cliente_Id, c.TipoSolicitud, c.Finalidad,
      c.CapitalInicial, c.CantidadCuotas, c.CuotasPagas, c.MontoCuotas,
      c.SaldoCapital, c.SaldoInteres, c.DiasAtraso,
      c.Estado, c.Moneda, c.Frecuencia, c.FechaOtorgado, c.TasaInteres, c.TasaMora,
      ch.NombreCompleto AS NombreSocio,
      ch.Documento AS DocumentoSocio
    FROM Creditos c
    LEFT JOIN ClientesHistorico ch ON c.Cliente_Id = ch.Id
    ${where}
    ORDER BY c.FechaOtorgado DESC
    OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
  `);

  return { data: dataResult.recordset, total, page, limit };
};

const getById = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('id', id)
    .query(`
      SELECT c.*, ch.NombreCompleto AS NombreSocio, ch.Documento AS DocumentoSocio
      FROM Creditos c
      LEFT JOIN ClientesHistorico ch ON c.Cliente_Id = ch.Id
      WHERE c.Id = @id
    `);
  return rs.recordset[0];
};
module.exports = { getAll, getById };