const db = require('../helpers/db');
const configuracionModel = require('./configuracion');

const calcularEdadAlCorte = (fechaNacimiento, corteMD) => {
    const [mes, dia] = corteMD.split('-').map(Number);
    const anioActual = new Date().getFullYear();
    const fechaCorte = new Date(anioActual, mes - 1, dia);
    const nacimiento = new Date(fechaNacimiento);
    let edad = fechaCorte.getFullYear() - nacimiento.getFullYear();
    const huboCumple = (fechaCorte.getMonth() > nacimiento.getMonth()) ||
        (fechaCorte.getMonth() === nacimiento.getMonth() && fechaCorte.getDate() >= nacimiento.getDate());
    if (!huboCumple) edad--;
    return edad;
};

const getByAfiliado = async function (idAfiliado) {
    const pool = await db.getConnection();
    const rs = await pool.request()
        .input('idAfiliado', idAfiliado)
        .query(`
      SELECT * FROM Hijos WHERE IdAfiliado = @idAfiliado ORDER BY PrimerApellido, PrimerNombre
    `);
    const fechaCorte = (await configuracionModel.getByClave('FechaCorteHijos')) || '04-30';
    return rs.recordset.map(h => ({
        ...h,
        EdadAlCorte: h.FechaNacimiento ? calcularEdadAlCorte(h.FechaNacimiento, fechaCorte) : null,
    }));
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
        .input('discapacidad', data.discapacidad ? 1 : 0)
        .input('patologia', data.patologia || null)
        .query(`
      INSERT INTO Hijos (Id, IdAfiliado, PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido,
        Documento, FechaNacimiento, CedulaPadre, CedulaMadre, Validado, Discapacidad, Patologia, FechaAlta)
      VALUES (@id, @idAfiliado, @primerNombre, @segundoNombre, @primerApellido, @segundoApellido,
        @documento, @fechaNacimiento, @cedulaPadre, @cedulaMadre, @validado, @discapacidad, @patologia, GETDATE())
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
        .input('discapacidad', data.discapacidad ? 1 : 0)
        .input('patologia', data.patologia || null)
        .query(`
      UPDATE Hijos SET
        PrimerNombre = @primerNombre, SegundoNombre = @segundoNombre,
        PrimerApellido = @primerApellido, SegundoApellido = @segundoApellido,
        Documento = @documento, FechaNacimiento = @fechaNacimiento,
        CedulaPadre = @cedulaPadre, CedulaMadre = @cedulaMadre,
        Discapacidad = @discapacidad, Patologia = @patologia
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