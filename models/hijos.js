const db = require('../helpers/db');

const getByAfiliado = async function (idAfiliado) {
    const pool = await db.getConnection();
    const rs = await pool.request()
        .input('idAfiliado', idAfiliado)
        .query(`
      SELECT * FROM Hijos WHERE IdAfiliado = @idAfiliado ORDER BY PrimerApellido, PrimerNombre
    `);
    return rs.recordset;
};

const create = async function (data) {
    const pool = await db.getConnection();
    const maxIdRes = await pool.request()
        .query('SELECT ISNULL(MAX(Id), 0) + 1 AS nextId FROM Hijos');
    const nextId = maxIdRes.recordset[0].nextId;
    await pool.request()
        .input('id', nextId)
        .input('idAfiliado', data.idAfiliado)
        .input('primerNombre', data.primerNombre)
        .input('segundoNombre', data.segundoNombre || null)
        .input('primerApellido', data.primerApellido)
        .input('segundoApellido', data.segundoApellido || null)
        .input('documento', data.documento || null)
        .input('fechaNacimiento', data.fechaNacimiento || null)
        .input('cedulaPadre', data.cedulaPadre || null)
        .input('cedulaMadre', data.cedulaMadre || null)
        .input('validado', 0)
        .query(`
      INSERT INTO Hijos (Id, IdAfiliado, PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido,
        Documento, FechaNacimiento, CedulaPadre, CedulaMadre, Validado, FechaAlta)
      VALUES (@id, @idAfiliado, @primerNombre, @segundoNombre, @primerApellido, @segundoApellido,
        @documento, @fechaNacimiento, @cedulaPadre, @cedulaMadre, @validado, GETDATE())
    `);
    return nextId;
};

const update = async function (id, data) {
    const pool = await db.getConnection();
    await pool.request()
        .input('id', id)
        .input('primerNombre', data.primerNombre)
        .input('segundoNombre', data.segundoNombre || null)
        .input('primerApellido', data.primerApellido)
        .input('segundoApellido', data.segundoApellido || null)
        .input('documento', data.documento || null)
        .input('fechaNacimiento', data.fechaNacimiento || null)
        .input('cedulaPadre', data.cedulaPadre || null)
        .input('cedulaMadre', data.cedulaMadre || null)
        .query(`
      UPDATE Hijos SET
        PrimerNombre = @primerNombre, SegundoNombre = @segundoNombre,
        PrimerApellido = @primerApellido, SegundoApellido = @segundoApellido,
        Documento = @documento, FechaNacimiento = @fechaNacimiento,
        CedulaPadre = @cedulaPadre, CedulaMadre = @cedulaMadre
      WHERE Id = @id
    `);
};

const validar = async function (id, validado) {
    const pool = await db.getConnection();
    await pool.request()
        .input('id', id)
        .input('validado', validado)
        .query('UPDATE Hijos SET Validado = @validado WHERE Id = @id');
};

const remove = async function (id) {
    const pool = await db.getConnection();
    await pool.request()
        .input('id', id)
        .query('DELETE FROM Hijos WHERE Id = @id');
};

module.exports = { getByAfiliado, create, update, validar, remove };