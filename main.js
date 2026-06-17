const path = require('path');
const _envPath = process.pkg
  ? path.join(path.dirname(process.execPath), '.env')
  : path.resolve(__dirname, '.env');
require('dotenv').config({ path: _envPath });
const express = require('express');
const cors = require('cors');
const app = express();
const config = require('./config/routes');
const security = require('./middlewares/api-security-controller');

const __PORT__ = process.env.APP_PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(
  security.authorizationBearer({
    allowUrls: [
      { url: '/portal/registrar', method: 'POST' },
      { url: '/portal/login', method: 'POST' },
      { url: '/portal/mis-datos', method: 'GET' },
      { url: '/portal/cambiar-password', method: 'PATCH' },
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
