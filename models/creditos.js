const db = require('../helpers/db');

const getAll = async function (filtros = {}) {
  const pool = await db.getConnection();
  let query = `
    SELECT 
      c.Id, c.Numero, c.Cliente_Id, c.TipoSolicitud, c.Finalidad,
      c.CapitalInicial, c.CantidadCuotas, c.CuotasPagas, c.MontoCuotas,
      c.SaldoCapital, c.SaldoInteres, c.DiasAtraso,
      c.Estado, c.Moneda, c.Frecuencia, c.FechaOtorgado, c.TasaInteres, c.TasaMora,
      ch.NombreCompleto AS NombreSocio,
      ch.Documento AS DocumentoSocio
    FROM Creditos c
    LEFT JOIN ClientesHistorico ch ON c.Cliente_Id = ch.Id
    WHERE 1=1
  `;
  const request = pool.request();

  if (filtros.estado) {
    query += ' AND Estado = @estado';
    request.input('estado', filtros.estado);
  }
  if (filtros.clienteId) {
    query += ' AND Cliente_Id = @clienteId';
    request.input('clienteId', filtros.clienteId);
  }
  if (filtros.busqueda) {
    query += ' AND (CAST(Numero AS VARCHAR) LIKE @busqueda OR CAST(Cliente_Id AS VARCHAR) LIKE @busqueda)';
    request.input('busqueda', `%${filtros.busqueda}%`);
  }

  query += ' ORDER BY FechaOtorgado DESC';

  // Paginación
  const page = parseInt(filtros.page) || 1;
  const limit = parseInt(filtros.limit) || 20;
  const offset = (page - 1) * limit;

  const countQuery = query.replace(
    `SELECT 
      Id, Numero, Cliente_Id, TipoSolicitud, Finalidad,
      CapitalInicial, CantidadCuotas, CuotasPagas, MontoCuotas,
      SaldoCapital, SaldoInteres, DiasAtraso,
      Estado, Moneda, Frecuencia, FechaOtorgado, TasaInteres, TasaMora`,
    'SELECT COUNT(*) AS total'
  ).replace(' ORDER BY FechaOtorgado DESC', '');

  const countResult = await request.query(countQuery);
  const total = countResult.recordset[0].total;

  query += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
  const rs = await request.query(query);

  return { data: rs.recordset, total, page, limit };
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