const model = require('../models/prestamos');
const PDFDocument = require('pdfkit');

const getAll = async (req, res) => {
  try {
    const { estado, idAfiliado, page, limit } = req.query;
    const result = await model.getAll({
      estado, idAfiliado,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.status(200).send({ error: false, ...result });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const data = await model.getById(req.params.id);
    if (!data) return res.status(404).send({ error: true, message: 'Préstamo no encontrado' });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { idAfiliado, lineas } = req.body;
    if (!idAfiliado) return res.status(400).send({ error: true, message: 'El afiliado es obligatorio' });
    if (!lineas || lineas.length === 0) return res.status(400).send({ error: true, message: 'Debe incluir al menos un libro' });
    const id = await model.create(idAfiliado, lineas);
    res.status(201).send({ error: false, data: { id } });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const devolver = async (req, res) => {
  try {
    await model.devolver(req.params.idLinea);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};


const generarPDF = async (req, res) => {
  try {
    const data = await model.getById(req.params.id);
    if (!data) return res.status(404).send({ error: true, message: 'Préstamo no encontrado' });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=prestamo_${data.Id}.pdf`);
    doc.pipe(res);

    // Encabezado
    doc.fontSize(18).text('APMU — Comprobante de Préstamo', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text('Asociación del Personal de Médica Uruguaya', { align: 'center' });
    doc.moveDown(1.5);

    // Datos del préstamo
    doc.fontSize(12).text(`Préstamo Nº: ${data.Id}`);
    doc.text(`Fecha: ${data.FechaPrestamo ? data.FechaPrestamo.toISOString().substring(0, 10).split('-').reverse().join('/') : ''}`);
    doc.moveDown(0.5);

    // Datos del afiliado
    doc.text(`Afiliado: ${data.NombreAfiliado}`);
    doc.text(`Documento: ${data.Documento}`);
    if (data.NroFuncionario) doc.text(`Nº de funcionario: ${data.NroFuncionario}`);
    doc.moveDown(1);

    // Tabla de libros
    doc.fontSize(12).text('Detalle de libros:', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const col1 = 50, col2 = 300, col3 = 420;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Libro', col1, tableTop);
    doc.text('Tipo', col2, tableTop);
    doc.text('Vencimiento', col3, tableTop);
    doc.moveTo(col1, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    doc.font('Helvetica');
    let y = tableTop + 22;
    data.lineas.forEach(l => {
      doc.text(l.NombreLibro, col1, y, { width: 240 });
      doc.text(l.Tipo || '—', col2, y);
      doc.text(l.FechaVencimiento ? l.FechaVencimiento.toISOString().substring(0, 10).split('-').reverse().join('/') : '—', col3, y);
      y += 20;
    });

    // Sección de cobro (libros de estudio)
    const librosEstudio = data.lineas.filter(l => l.Tipo === 'Estudio');
    if (librosEstudio.length > 0) {
      y += 20;
      doc.moveTo(col1, y).lineTo(545, y).stroke();
      y += 10;

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Detalle de cobro:', col1, y, { underline: true });
      y += 20;

      doc.font('Helvetica').fontSize(10);
      doc.text(`${librosEstudio.length} libro(s) de estudio x $200`, col1, y);
      doc.text(`$${librosEstudio.length * 200}`, col3, y);
      y += 20;

      doc.font('Helvetica-Bold');
      doc.text('Total a cobrar:', col1, y);
      doc.text(`$${librosEstudio.length * 200}`, col3, y);
      doc.font('Helvetica');
    }

    // Firmas
    y = Math.max(y + 60, doc.y + 60);

    doc.moveTo(50, y).lineTo(250, y).stroke();
    doc.fontSize(10).text('Firma del afiliado', 50, y + 5);

    doc.moveTo(300, y).lineTo(500, y).stroke();
    doc.text('Firma del responsable', 300, y + 5);

    doc.end();
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, getById, create, devolver, generarPDF };

