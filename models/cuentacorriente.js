const db = require('../helpers/db');

const getAll = async function ({ page = 1, limit = 20, idAfiliado, aniomes, estado }) {
  const pool = await db.getConnection();
  const offset = (page - 1) * limit;
  const request = pool.request();

  let where = 'WHERE 1=1';

  if (idAfiliado) {
    where += ' AND cc.IdAfiliado = @IdAfiliado';
    request.input('IdAfiliado', db.sql.Int, idAfiliado);
  }
  if (aniomes) {
    where += ' AND cc.Aniomes = @Aniomes';
    request.input('Aniomes', db.sql.Numeric(6, 0), aniomes);
  }
    if (estado === 'pendiente') {
    where += ' AND cc.NroRecibo IS NULL';
    } else if (estado === 'pagado') {
    where += ' AND cc.NroRecibo IS NOT NULL';
    } else if (estado === 'vencido') {
    where += ' AND cc.NroRecibo IS NULL AND cc.FechaVto < GETDATE()';
    }

  request.input('offset', db.sql.Int, offset);
  request.input('limit', db.sql.Int, limit);

  const rs = await request.query(`
    SELECT
      cc.*,
      a.PrimerNombre + ' ' + a.PrimerApellido AS NombreAfiliado,
      a.Documento,
      r.RubDsc,
      COUNT(*) OVER() AS TotalRecords
    FROM CuentaCorriente cc
    LEFT JOIN Afiliados a ON a.Id = cc.IdAfiliado
    LEFT JOIN Rubros r ON r.RubCod = cc.Rubro
    ${where}
    ORDER BY cc.Aniomes DESC, cc.Id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  const total = rs.recordset.length > 0 ? rs.recordset[0].TotalRecords : 0;
  const data = rs.recordset.map(({ TotalRecords, ...row }) => row);
  return { data, total, page: +page, limit: +limit };
};

const getById = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('Id', db.sql.Int, id)
    .query(`
      SELECT cc.*, 
        a.PrimerNombre + ' ' + a.PrimerApellido AS NombreAfiliado,
        r.RubDsc
      FROM CuentaCorriente cc
      LEFT JOIN Afiliados a ON a.Id = cc.IdAfiliado
      LEFT JOIN Rubros r ON r.RubCod = cc.Rubro
      WHERE cc.Id = @Id
    `);
  return rs.recordset[0] || null;
};

const create = async function (c) {
  const pool = await db.getConnection();
  const maxIdRes = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM CuentaCorriente');
  const nextId = maxIdRes.recordset[0].nextId;

  const rs = await pool.request()
    .input('Id',          db.sql.Int,           nextId)
    .input('IdAfiliado',  db.sql.Int,            c.IdAfiliado)
    .input('Rubro',       db.sql.SmallInt,       c.Rubro)
    .input('Importe',     db.sql.Decimal(19, 2), c.Importe || null)
    .input('Aniomes',     db.sql.Numeric(6, 0),  c.Aniomes)
    .input('Mes',         db.sql.DateTime,       c.Mes || null)
    .input('FechaVto',    db.sql.DateTime,       c.FechaVto || null)
    .input('FechaCargo',  db.sql.Date,           c.FechaCargo || null)
    .input('Usuario',     db.sql.VarChar(30),    c.Usuario || null)
    .query(`
      INSERT INTO CuentaCorriente (
        Id, IdAfiliado, Rubro, Importe, Aniomes,
        Mes, FechaVto, FechaCargo, Usuario
      )
      OUTPUT INSERTED.Id
      VALUES (
        @Id, @IdAfiliado, @Rubro, @Importe, @Aniomes,
        @Mes, @FechaVto, @FechaCargo, @Usuario
      )
    `);
  return rs.recordset[0].Id;
};

const update = async function (id, c) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('Id',         db.sql.Int,            id)
    .input('IdAfiliado', db.sql.Int,            c.IdAfiliado)
    .input('Rubro',      db.sql.SmallInt,       c.Rubro)
    .input('Importe',    db.sql.Decimal(19, 2), c.Importe || null)
    .input('Aniomes',    db.sql.Numeric(6, 0),  c.Aniomes)
    .input('Mes',        db.sql.DateTime,       c.Mes || null)
    .input('FechaVto',   db.sql.DateTime,       c.FechaVto || null)
    .input('FechaCargo', db.sql.Date,           c.FechaCargo || null)
    .input('Usuario',    db.sql.VarChar(30),    c.Usuario || null)
    .query(`
      UPDATE CuentaCorriente SET
        IdAfiliado = @IdAfiliado,
        Rubro      = @Rubro,
        Importe    = @Importe,
        Aniomes    = @Aniomes,
        Mes        = @Mes,
        FechaVto   = @FechaVto,
        FechaCargo = @FechaCargo,
        Usuario    = @Usuario
      WHERE Id = @Id AND NroRecibo IS NULL
    `);
  return rs.rowsAffected[0];
};

const cobrar = async function (id, pago) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('Id',        db.sql.Int,          id)
    .input('NroRecibo', db.sql.Int,          pago.NroRecibo)
    .input('FechaPago', db.sql.DateTime,     pago.FechaPago)
    .input('FormaPago', db.sql.VarChar(20),  pago.FormaPago)
    .query(`
      UPDATE CuentaCorriente SET
        NroRecibo = @NroRecibo,
        FechaPago = @FechaPago,
        FormaPago = @FormaPago
      WHERE Id = @Id AND NroRecibo IS NULL
    `);
  return rs.rowsAffected[0];
};

const remove = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('Id', db.sql.Int, id)
    .query('DELETE FROM CuentaCorriente WHERE Id = @Id AND NroRecibo IS NULL');
  return rs.rowsAffected[0];
};

module.exports = { getAll, getById, create, update, cobrar, remove };