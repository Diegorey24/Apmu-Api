const db = require('../helpers/db');
const cajaChicaModel = require('./cajachica');

const DENOMINACIONES = [
  'B2000', 'B1000', 'B500', 'B200', 'B100', 'B50', 'B20',
  'M50', 'M10', 'M5', 'M2', 'M1',
];

const CAMPOS = DENOMINACIONES.flatMap(d => [`${d}_CajaFte`, `${d}_Caja`]);

const getAll = async function (filtros = {}) {
  const pool = await db.getConnection();
  const request = pool.request();
  let where = '';
  if (filtros.fechaDesde) { where += ' AND Fecha >= @fechaDesde'; request.input('fechaDesde', filtros.fechaDesde); }
  if (filtros.fechaHasta) { where += ' AND Fecha <= @fechaHasta'; request.input('fechaHasta', filtros.fechaHasta); }

  const rs = await request.query(`
    SELECT * FROM ArqueoEfectivo
    WHERE 1=1 ${where}
    ORDER BY Fecha DESC, Id DESC
  `);
  return rs.recordset;
};

const getById = async function (id) {
  const pool = await db.getConnection();
  const rs = await pool.request()
    .input('id', id)
    .query('SELECT * FROM ArqueoEfectivo WHERE Id = @id');
  return rs.recordset[0];
};

const create = async function (data) {
  const pool = await db.getConnection();
  const maxIdRes = await pool.request()
    .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM ArqueoEfectivo');
  const nextId = maxIdRes.recordset[0].nextId;

  const request = pool.request();
  request.input('id', nextId);
  request.input('fecha', data.fecha);
  request.input('hora', data.hora || null);
  request.input('realizadoPor', data.realizadoPor || null);
  request.input('usuario', data.usuario || null);

  let totalArqueo = 0;
  CAMPOS.forEach(campo => {
    const valor = parseFloat(data[campo]) || 0;
    totalArqueo += valor;
    request.input(campo, valor);
  });

  const saldoFondoFijo = await cajaChicaModel.getSaldoTotal();
  const diferencia = totalArqueo - saldoFondoFijo;

  request.input('totalArqueo', totalArqueo);
  request.input('saldoFondoFijo', saldoFondoFijo);
  request.input('diferencia', diferencia);

  const columnas = ['Id', 'Fecha', 'Hora', 'RealizadoPor', ...CAMPOS, 'TotalArqueo', 'SaldoFondoFijo', 'Diferencia', 'Usuario', 'FechaAlta'];
  const valores = ['@id', '@fecha', '@hora', '@realizadoPor', ...CAMPOS.map(c => `@${c}`), '@totalArqueo', '@saldoFondoFijo', '@diferencia', '@usuario', 'GETDATE()'];

  await request.query(`
    INSERT INTO ArqueoEfectivo (${columnas.join(', ')})
    VALUES (${valores.join(', ')})
  `);

  return { id: nextId, totalArqueo, saldoFondoFijo, diferencia };
};

const remove = async function (id) {
  const pool = await db.getConnection();
  await pool.request()
    .input('id', id)
    .query('DELETE FROM ArqueoEfectivo WHERE Id = @id');
};

module.exports = { DENOMINACIONES, CAMPOS, getAll, getById, create, remove };
