const mssql = require('mssql');
const pools = new Map();

module.exports = {
  get: (name, config) => {
    if (!pools.has(name)) {
      if (!config) {
        throw new Error('Pool does not exist');
      }
      const pool = new mssql.ConnectionPool(config);
      const close = pool.close.bind(pool);
      pool.close = (...args) => {
        pools.delete(name);
        return close(...args);
      };
      pools.set(name, pool.connect());
    }
    return pools.get(name);
  },
  closeAll: () =>
    Promise.all(
      Array.from(pools.values()).map((connect) =>
        connect.then((pool) => pool.close())
      )
    ),
  sql: mssql,
};
