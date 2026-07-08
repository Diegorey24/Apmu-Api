const db = require('../helpers/db');

const getAll = async function () {
    const pool = await db.getConnection();
    const rs = await pool.request().query('SELECT * FROM Categorias ORDER BY Nombre');
    return rs.recordset;
};

const create = async function (nombre) {
    const pool = await db.getConnection();
    const maxIdRes = await pool.request()
        .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM Categorias');
    const nextId = maxIdRes.recordset[0].nextId;
    await pool.request()
        .input('id', nextId)
        .input('nombre', nombre)
        .query('INSERT INTO Categorias (Id, Nombre) VALUES (@id, @nombre)');
    return nextId;
};

const update = async function (id, nombre) {
    const pool = await db.getConnection();
    await pool.request()
        .input('id', id)
        .input('nombre', nombre)
        .query('UPDATE Categorias SET Nombre = @nombre WHERE Id = @id');
};

const remove = async function (id) {
    const pool = await db.getConnection();
    const check = await pool.request()
        .input('id', id)
        .query('SELECT COUNT(*) AS total FROM Afiliados WHERE IdCategoria = @id');
    if (check.recordset[0].total > 0) {
        throw new Error('No se puede eliminar: tiene afiliados asociados');
    }
    await pool.request()
        .input('id', id)
        .query('DELETE FROM Categorias WHERE Id = @id');
};

module.exports = { getAll, create, update, remove };