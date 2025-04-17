const request = require("supertest");
const pool = require("../../database/db");
const app = require("../../server");

exports.createTempUserReturnIdx = async ({ id, pw, nickname, email, role, oauth_idx = null }) => {
  const client = await pool.connect();
  const results = await client.query(
    `
      INSERT INTO users.lists (
        id, pw, nickname, email, role, oauth_idx
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      )
      RETURNING idx AS users_idx;
    `,
    [id, pw, nickname, email, role, oauth_idx]
  );
  client.release();

  return results.rows[0].users_idx;
};

exports.getCookieSavedAccessTokenAfterSignin = async ({ id, pw }) => {
  const res = await request(app).post("/auth/signin").send({ id, pw });
  const cookie = res.headers["set-cookie"].find((cookie) => cookie.startsWith("accessToken="));

  return cookie;
};

exports.createTempCateoryReturnIdx = async ({ users_idx, category_name }) => {
  const client = await pool.connect();
  const results = await client.query(
    `
      INSERT INTO restaurants.categories (
        users_idx, name
      ) VALUES (
        $1, $2 
      )
      RETURNING idx AS category_idx;
    `,
    [users_idx, category_name]
  );
  client.release();

  return results.rows[0].category_idx;
};

exports.createTempRestaurantReturnIdx = async ({
  category_idx,
  users_idx,
  restaurant_name,
  longitude,
  latitude,
  address,
  address_detail,
  phone,
  start_time,
  end_time,
}) => {
  const client = await pool.connect();
  const results = await client.query(
    `
      INSERT INTO restaurants.lists (
        categories_idx,
        users_idx,
        name,
        longitude,
        latitude,
        location,
        address,
        address_detail,
        phone,
        start_time,
        end_time
      ) VALUES (
        $1, $2, $3, $4, $5,
        ST_SetSRID(ST_MakePoint($4, $5), 4326), 
        $6, $7, $8, $9, $10
      )
      RETURNING idx AS restaurant_idx
    `,
    [
      category_idx,
      users_idx,
      restaurant_name,
      longitude,
      latitude,
      address,
      address_detail,
      phone,
      start_time,
      end_time,
    ]
  );
  client.release();

  return results.rows[0].restaurant_idx;
};
