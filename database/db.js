const { Pool } = require("pg");
const config = require("./config");

const pool = new Pool({ ...config[process.env.NODE_ENV], port: 5432 });

module.exports = pool;
