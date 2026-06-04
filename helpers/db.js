const dbConfig = require('../config/database');
const manager = require('./pool-manager');

const getConnection = async function () {
  try {
    return await manager.get('gestion', dbConfig.configGestion);
  } catch (err) {
    console.log('SQLException: ' + err.message);
  }
};

const getApiConnection = async function () {
  try {
    return await manager.get('api', dbConfig.configApi);
  } catch (err) {
    console.log('SQLException: ' + err.message);
  }
};

const sql = manager.sql;

module.exports = {
  sql,
  getConnection,
  getApiConnection,
};
