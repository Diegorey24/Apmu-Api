const model = require('../models/prestamos-articulos');
const PDFDocument = require('pdfkit');

const getAll = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, estado } = req.query;
    const data = await model.getAll({ fechaDesde, fechaHasta, estado });
    res.status(200).send({ error: false, data });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const validar = (body) => {
  if (!body.idAfiliado) return 'El afiliado es obligatorio';
  if (!body.fechaPrestamo) return 'La fecha de préstamo es obligatoria';
  if (!body.fechaDesde) return 'La fecha desde es obligatoria';
  if (!body.fechaHasta) return 'La fecha hasta es obligatoria';
  if (!body.articulo?.trim()) return 'El artículo es obligatorio';
  return null;
};

const create = async (req, res) => {
  try {
    const err = validar(req.body);
    if (err) return res.status(400).send({ error: true, message: err });

    const activo = await model.existeAfiliadoActivo(req.body.idAfiliado);
    if (!activo) return res.status(400).send({ error: true, message: 'El afiliado no existe o no está activo' });

    const id = await model.create(req.body);
    res.status(201).send({ error: false, data: { id } });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const err = validar(req.body);
    if (err) return res.status(400).send({ error: true, message: err });

    await model.update(req.params.id, req.body);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const devolver = async (req, res) => {
  try {
    await model.devolver(req.params.id);
    res.status(200).send({ error: false });
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await model.remove(req.params.id);
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
    res.setHeader('Content-Disposition', `inline; filename=prestamo_articulo_${data.Id}.pdf`);
    doc.pipe(res);

    const fmt = (f) => f ? f.toISOString().substring(0, 10).split('-').reverse().join('/') : '—';

    doc.fontSize(18).text('Comprobante de Préstamo de Artículo', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text('Asociación del Personal de Médica Uruguaya', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(12).text(`Nº de funcionario: ${data.NroFuncionario || '—'}`);
    doc.text(`Nombre: ${data.PrimerNombre} ${data.PrimerApellido}`);
    doc.text(`CI: ${data.Documento}`);
    doc.text(`Teléfono: ${data.Celular || data.Telefono || '—'}`);
    doc.moveDown(1);

    doc.text(`Fecha de préstamo: ${fmt(data.FechaPrestamo)}`);
    doc.text(`Período: ${fmt(data.FechaDesde)} al ${fmt(data.FechaHasta)}`);
    doc.moveDown(0.5);
    doc.text(`Artículo: ${data.Articulo}`);
    if (data.Observaciones) {
      doc.moveDown(0.5);
      doc.text(`Observaciones: ${data.Observaciones}`);
    }

    doc.moveDown(4);
    doc.text('Firma: ____________________');

    doc.end();
  } catch (err) {
    res.status(500).send({ error: true, message: err.message });
  }
};

module.exports = { getAll, create, update, devolver, remove, generarPDF };
