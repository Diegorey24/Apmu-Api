const db = require('../helpers/db');

const getAll = async function (filtros = {}) {
  const pool = await db.getConnection();
  const request = pool.request();
  let where = '';
  if (filtros.fechaDesde) { where += ' AND Fecha >= @fechaDesde'; request.input('fechaDesde', filtros.fechaDesde); }
  if (filtros.fechaHasta) { where += ' AND Fecha <= @fechaHasta'; request.input('fechaHasta', filtros.fechaHasta); }

  const rs = await request.query(`
    SELECT * FROM (
      SELECT
        b.Id, b.Fecha, b.Tipo, b.Descripcion, b.Importe, b.Usuario,
        b.Comprobante, b.CodigoCuenta, b.IdCentroCosto, b.Debe, b.Haber, b.NroComp,
        pc.Descripcion AS CuentaDescripcion,
        cco.Nombre AS CentroCostoNombre,
        SUM(
          CASE WHEN b.Debe IS NULL AND b.Haber IS NULL
            THEN CASE WHEN b.Tipo = 'Entrada' THEN ISNULL(b.Importe, 0) ELSE -ISNULL(b.Importe, 0) END
            ELSE ISNULL(b.Debe, 0) - ISNULL(b.Haber, 0)
          END
        ) OVER (ORDER BY b.Fecha, b.Id) AS SaldoAcumulado
      FROM Banco b
      LEFT JOIN PlanCuentas pc ON b.CodigoCuenta = pc.Codigo
      LEFT JOIN CentrosCosto cco ON b.IdCentroCosto = cco.Id
    ) sub
    WHERE 1=1 ${where}
    ORDER BY Fecha, Id
  `);
  return rs.recordset;
};

const getResumen = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query(`
    SELECT
      ISNULL(SUM(ISNULL(Debe, 0)), 0) AS TotalEntradas,
      ISNULL(SUM(ISNULL(Haber, 0)), 0) AS TotalSalidas,
      ISNULL(SUM(ISNULL(Debe, 0) - ISNULL(Haber, 0)), 0) AS Saldo
    FROM Banco
  `);
  return rs.recordset[0];
};

const calcularNroComp = async function (pool, fecha) {
  const rs = await pool.request()
    .input('fecha', fecha)
    .query(`
      SELECT ISNULL(MAX(NroComp), 0) + 1 AS next FROM Banco
      WHERE MONTH(Fecha) = MONTH(@fecha) AND YEAR(Fecha) = YEAR(@fecha)
    `);
  return rs.recordset[0].next;
};

const create = async function (data) {
  const pool = await db.getConnection();
  const maxIdRes = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM Banco');
  const nextId = maxIdRes.recordset[0].nextId;

  const debe = parseFloat(data.debe) > 0 ? parseFloat(data.debe) : null;
  const haber = parseFloat(data.haber) > 0 ? parseFloat(data.haber) : null;
  const tipo = debe ? 'Entrada' : (haber ? 'Salida' : data.tipo);
  const importe = debe || haber || data.importe;

  const nroComp = await calcularNroComp(pool, data.fecha);

  await pool.request()
    .input('id', nextId)
    .input('fecha', data.fecha)
    .input('tipo', tipo)
    .input('descripcion', data.descripcion)
    .input('importe', importe)
    .input('usuario', data.usuario || null)
    .input('comprobante', data.comprobante || null)
    .input('codigoCuenta', data.codigoCuenta || null)
    .input('idCentroCosto', data.idCentroCosto || null)
    .input('debe', debe)
    .input('haber', haber)
    .input('nroComp', nroComp)
    .query(`
      INSERT INTO Banco (Id, Fecha, Tipo, Descripcion, Importe, Usuario, Comprobante, CodigoCuenta, IdCentroCosto, Debe, Haber, NroComp)
      VALUES (@id, @fecha, @tipo, @descripcion, @importe, @usuario, @comprobante, @codigoCuenta, @idCentroCosto, @debe, @haber, @nroComp)
    `);
  return nextId;
};

const update = async function (id, data) {
  const pool = await db.getConnection();

  const actual = await getById(id);

  const debe = parseFloat(data.debe) > 0 ? parseFloat(data.debe) : null;
  const haber = parseFloat(data.haber) > 0 ? parseFloat(data.haber) : null;
  const tipo = debe ? 'Entrada' : (haber ? 'Salida' : data.tipo);
  const importe = debe || haber || data.importe;

  let nroComp = actual.NroComp;
  const fechaVieja = new Date(actual.Fecha);
  const fechaNueva = new Date(data.fecha);
  const mismoMes = fechaVieja.getFullYear() === fechaNueva.getFullYear() && fechaVieja.getMonth() === fechaNueva.getMonth();
  if (!mismoMes) {
    nroComp = await calcularNroComp(pool, data.fecha);
  }

  await pool.request()
    .input('id', id)
    .input('fecha', data.fecha)
    .input('tipo', tipo)
    .input('descripcion', data.descripcion)
    .input('importe', importe)
    .input('usuario', data.usuario || null)
    .input('comprobante', data.comprobante || null)
    .input('codigoCuenta', data.codigoCuenta || null)
    .input('idCentroCosto', data.idCentroCosto || null)
    .input('debe', debe)
    .input('haber', haber)
    .input('nroComp', nroComp)
    .query(`
      UPDATE Banco SET
        Fecha = @fecha, Tipo = @tipo, Descripcion = @descripcion,
        Importe = @importe, Usuario = @usuario,
        Comprobante = @comprobante, CodigoCuenta = @codigoCuenta, IdCentroCosto = @idCentroCosto,
        Debe = @debe, Haber = @haber, NroComp = @nroComp
      WHERE Id = @id
    `);
};

const remove = async function (id) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .query('DELETE FROM Banco WHERE Id = @id');
};

const getSaldoTotal = async function () {
  const pool = await db.getConnection();
  const rs = await pool.request().query(`
    SELECT ISNULL(SUM(
      CASE WHEN Debe IS NULL AND Haber IS NULL
        THEN CASE WHEN Tipo = 'Entrada' THEN Importe ELSE -Importe END
        ELSE ISNULL(Debe, 0) - ISNULL(Haber, 0)
      END
    ), 0) AS Saldo
    FROM Banco
  `);
  return rs.recordset[0].Saldo;
};

const getById = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('id', id)
    .query('SELECT * FROM Banco WHERE Id = @id');
  return rs.recordset[0];
};

module.exports = { getAll, getResumen, getSaldoTotal, getById, create, update, remove };
