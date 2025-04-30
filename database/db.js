const { Pool } = require("pg");
const config = require("./config");

let injectedPool;
const defaultPool = new Pool({ ...config[process.env.NODE_ENV], port: 5432 });

function setPool(pool) {
  injectedPool = pool;
}

function getPool() {
  return injectedPool || defaultPool;
}

module.exports = { setPool, getPool };
