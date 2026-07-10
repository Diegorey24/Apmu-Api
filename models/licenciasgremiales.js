const db = require('../helpers/db');

const getAll = async function (filtros = {}) {
    const pool = await db.getConnection();
    let query = `
    SELECT lg.*, 
      a.PrimerNombre + ' ' + a.PrimerApellido + ISNULL(' ' + a.SegundoApellido, '') AS NombreAfiliado,
      a.Documento, a.NroFuncionario, a.Cargo, a.Sector
    FROM LicenciasGremiales lg
    INNER JOIN Afiliados a ON lg.IdAfiliado = a.Id
    WHERE 1=1
  `;
    const request = pool.request();

    if (filtros.idAfiliado) {
        query += ' AND lg.IdAfiliado = @idAfiliado';
        request.input('idAfiliado', filtros.idAfiliado);
    }
    if (filtros.fechaDesde) {
        query += ' AND lg.FechaLicencia >= @fechaDesde';
        request.input('fechaDesde', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
        query += ' AND lg.FechaLicencia <= @fechaHasta';
        request.input('fechaHasta', filtros.fechaHasta);
    }

    query += ' ORDER BY lg.FechaLicencia DESC';
    const rs = await request.query(query);
    return rs.recordset;
};

const create = async function (data) {
    const pool = await db.getConnection();
    const maxIdRes = await pool.request()
        .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM LicenciasGremiales');
    const nextId = maxIdRes.recordset[0].nextId;
    await pool.request()
        .input('id', nextId)
        .input('idAfiliado', data.idAfiliado)
        .input('solicitadaPor', data.solicitadaPor || null)
        .input('horario', data.horario || null)
        .input('fechaLicencia', data.fechaLicencia)
        .input('pedidaPor', data.pedidaPor || null)
        .input('convocatoria', data.convocatoria || null)
        .input('comision', data.comision || null)
        .query(`
      INSERT INTO LicenciasGremiales (Id, IdAfiliado, SolicitadaPor, Horario, FechaLicencia, PedidaPor, Convocatoria, Comision)
      VALUES (@id, @idAfiliado, @solicitadaPor, @horario, @fechaLicencia, @pedidaPor, @convocatoria, @comision)
    `);
    return nextId;
};

const update = async function (id, data) {
    const pool = await db.getConnection();
    await pool.request()
        .input('id', id)
        .input('idAfiliado', data.idAfiliado)
        .input('solicitadaPor', data.solicitadaPor || null)
        .input('horario', data.horario || null)
        .input('fechaLicencia', data.fechaLicencia)
        .input('pedidaPor', data.pedidaPor || null)
        .input('convocatoria', data.convocatoria || null)
        .input('comision', data.comision || null)
        .query(`
      UPDATE LicenciasGremiales SET
        IdAfiliado = @idAfiliado,
        SolicitadaPor = @solicitadaPor,
        Horario = @horario,
        FechaLicencia = @fechaLicencia,
        PedidaPor = @pedidaPor,
        Convocatoria = @convocatoria,
        Comision = @comision
      WHERE Id = @id
    `);
};

const remove = async function (id) {
    const pool = await db.getConnection();
    await pool.request()
        .input('id', id)
        .query('DELETE FROM LicenciasGremiales WHERE Id = @id');
};

module.exports = { getAll, create, update, remove };