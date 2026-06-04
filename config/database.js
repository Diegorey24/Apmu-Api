const path = require('path');
const _envPath = process.pkg
  ? path.join(path.dirname(process.execPath), '.env')
  : path.resolve(__dirname, '.env');
require('dotenv').config({ path: _envPath });

const gestionServer = process.env.GESTION_DB_SERVER || '';
const gestionPort = process.env.GESTION_DB_PORT ? parseInt(process.env.GESTION_DB_PORT) : undefined;

const configGestion = {
  user: process.env.GESTION_DB_USER,
  password: process.env.GESTION_DB_PASS,
  database: process.env.GESTION_DB_DATABASE,
  server: gestionServer,
  ...(gestionPort && { port: gestionPort }),
  options: {
    encrypt: false,
    trustServerCertificate: true,
  }
};

const configApi = {
  user: process.env.API_DB_USER,
  password: process.env.API_DB_PASS,
  database: process.env.API_DB_DATABASE,
  server: process.env.API_DB_SERVER,
  port: process.env.API_DB_PORT * 1,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

module.exports = {
  configGestion,
  configApi,
};
