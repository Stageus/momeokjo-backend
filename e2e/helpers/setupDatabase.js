const { Pool } = require("pg");
const config = require("../../database/config");
const { getPool, setPool } = require("../../database/db");

let client;
let pool;
exports.initializeDatabase = async () => {
  setPool(new Pool({ ...config[process.env.NODE_ENV], port: 5432 }));
  pool = getPool();
  client = await getPool().connect();
  return pool;
};

exports.clearDatabase = async () => {
  await client.query(`DELETE FROM reviews.likes;`);
  await client.query(`DELETE FROM reviews.reports;`);
  await client.query(`DELETE FROM reviews.lists;`);

  await client.query(`DELETE FROM menus.likes;`);
  await client.query(`DELETE FROM menus.reports;`);
  await client.query(`DELETE FROM menus.lists;`);

  await client.query(`DELETE FROM restaurants.likes;`);
  await client.query(`DELETE FROM restaurants.reports;`);
  await client.query(`DELETE FROM restaurants.lists;`);
  await client.query(`DELETE FROM restaurants.categories;`);

  await client.query(`DELETE FROM users.reports;`);
  await client.query(`DELETE FROM users.lists`);
  await client.query(`DELETE FROM users.oauth`);
  await client.query(`DELETE FROM users.codes`);
};

exports.disconnectDatabse = async () => {
  client.release();
  await pool.end();
};
