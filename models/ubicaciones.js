const db = require('../helpers/db');

const getAll = async function () {
    const pool = await db.getConnection();
    const rs = await pool.request()
        .query('SELECT * FROM Ubicaciones ORDER BY Nombre');
    return rs.recordset;
};

const create = async function (data) {
    const pool = await db.getConnection();
    const maxIdRes = await pool.request()
        .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM Ubicaciones');
    const nextId = maxIdRes.recordset[0].nextId;
    await pool.request()
        .input('id', nextId)
        .input('codigo', data.codigo)
        .input('tipo', data.tipo)
        .input('nombre', data.nombre)
        .query(`INSERT INTO Ubicaciones (Id, Codigo, Tipo, Nombre)
            VALUES (@id, @codigo, @tipo, @nombre)`);
    return nextId;
};

const update = async function (id, data) {
    const pool = await db.getConnection();
    await pool.request()
        .input('id', id)
        .input('codigo', data.codigo)
        .input('tipo', data.tipo)
        .input('nombre', data.nombre)
        .query(`UPDATE Ubicaciones SET Codigo = @codigo, Tipo = @tipo, Nombre = @nombre
            WHERE Id = @id`);
};

const remove = async function (id) {
    const pool = await db.getConnection();
    const check = await pool.request()
        .input('id', id)
        .query('SELECT COUNT(*) AS total FROM Afiliados WHERE IdUbicacion = @id');
    if (check.recordset[0].total > 0) {
        throw new Error('No se puede eliminar: tiene afiliados asociados');
    }
    await pool.request()
        .input('id', id)
        .query('DELETE FROM Ubicaciones WHERE Id = @id');
};

module.exports = { getAll, create, update, remove };