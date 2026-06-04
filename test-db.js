const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'MacroEfact99',
  database: 'FUMTEP',
  server: 'LAPTOP-Q12IPPLM',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    instanceName: 'SQL2025'
  }
};

sql.connect(config)
  .then(() => console.log('✅ Conectado'))
  .catch(err => console.error('❌', err.message, '\nCódigo:', err.code));