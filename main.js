const path = require('path');
const _envPath = process.pkg
  ? path.join(path.dirname(process.execPath), '.env')
  : path.resolve(__dirname, '.env');
require('dotenv').config({ path: _envPath });
const express = require('express');
const cors = require('cors');
const app = express();
const config = require('./config/routes');
const { authenticateToken } = require('./middlewares/authenticateToken');
const usersModel = require('./models/users');

const __PORT__ = process.env.APP_PORT || 8080;

if (!process.env.JWT_SECRET) {
  console.error('Error: falta JWT_SECRET en el .env');
  process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(
  authenticateToken({
    allowUrls: [
      { url: '^/auth/login$', method: 'POST' },
      { url: '/portal/registrar', method: 'POST' },
      { url: '/portal/login', method: 'POST' },
      { url: '/portal/mis-datos', method: 'GET' },
      { url: '/portal/cambiar-password', method: 'PATCH' },
      { url: '/solicitudes-afiliacion', method: 'POST' },
      { url: '/solicitudes-afiliacion', method: 'POST' },
      { url: '/ubicaciones', method: 'GET' },
      { url: '/portal/contacto', method: 'PATCH' },
      { url: '/portal/mis-hijos', method: 'GET' },
      { url: '/portal/solicitar-libro', method: 'POST' },
      { url: '/portal/mis-solicitudes', method: 'GET' },
      { url: '/libros', method: 'GET' },
      { url: '/portal/mis-solicitudes', method: 'GET' },
      { url: '^/prestamos/\\d+/pdf', method: 'GET' },
      { url: '^/prestamos-articulos/\\d+/pdf', method: 'GET' },
    ],
  })
);

app.use(function (err, req, res, next) {
  if (err) {
    const method = req.method;
    const url = req.url;
    console.log(method + ' ' + url + ' StatusCode 400');
    res.status(400).send({ message: 'Error 400' });
  } else {
    next();
  }
});

app.use('/', config);

const start = async () => {
  try {
    await usersModel.hashPlaintextPasswords();
  } catch (err) {
    console.error('No se pudieron migrar los passwords de Usuarios:', err.message);
  }

  const server = app.listen(__PORT__);

  server.on('listening', () => {
    const addr = server.address();
    console.log('Servidor en http://%s:%s', addr.address, addr.port);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Error: el puerto ${__PORT__} ya está en uso. Cambiá APP_PORT en el .env`);
    } else {
      console.error('Error al iniciar el servidor:', err.message);
    }
    process.exit(1);
  });
};

start();
