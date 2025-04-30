const request = require("supertest");
const app = require("../../server");
const COOKIE_NAME = require("../../utils/cookieName");

exports.createTempUserReturnIdx = async ({
  id,
  pw,
  nickname,
  email,
  role,
  oauth_idx = null,
  pool,
}) => {
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
  const cookie = res.headers["set-cookie"].find((cookie) =>
    cookie.startsWith(`${COOKIE_NAME.ACCESS_TOKEN}=`)
  );

  return cookie;
};

exports.createTempCateoryReturnIdx = async ({ users_idx, category_name, pool }) => {
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
  pool,
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
      RETURNING idx AS restaurants_idx
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

  return results.rows[0].restaurants_idx;
};

exports.createTempMenuReturnIdx = async ({
  users_idx,
  restaurants_idx,
  menu_name,
  price,
  pool,
}) => {
  const client = await pool.connect();
  const results = await client.query(
    `
      INSERT INTO menus.lists (
        users_idx,
        restaurants_idx,
        name,
        price
      ) VALUES (
        $1, $2, $3, $4
      )
      RETURNING idx AS menu_idx;
    `,
    [users_idx, restaurants_idx, menu_name, price]
  );
  client.release();

  return results.rows[0].menu_idx;
};

exports.createTempReviewReturnIdx = async ({
  users_idx,
  menus_idx,
  content,
  image_url,
  restaurants_idx,
  pool,
}) => {
  const client = await pool.connect();
  const results = await client.query(
    `
      INSERT INTO reviews.lists (
        users_idx,
        menus_idx,
        content,
        image_url,
        restaurants_idx
      ) VALUES (
        $1, $2, $3, $4, $5
      )
      RETURNING idx AS review_idx;
    `,
    [users_idx, menus_idx, content, image_url, restaurants_idx]
  );
  client.release();

  return results.rows[0]?.review_idx;
};

exports.createTempRestaurantLikes = async ({ restaurants_idx, users_idx, pool }) => {
  const client = await pool.connect();
  await client.query(
    `
      INSERT INTO restaurants.likes (
        restaurants_idx,
        users_idx
      ) VALUES (
        $1,
        $2
      );
    `,
    [restaurants_idx, users_idx]
  );
  client.release();
};

exports.createTempMenuLikes = async ({ menu_idx, users_idx, pool }) => {
  const client = await pool.connect();
  await client.query(
    `
    INSERT INTO menus.likes (
      menus_idx,
      users_idx
    ) VALUES (
      $1,
      $2
    );
  `,
    [menu_idx, users_idx]
  );
  client.release();
};

exports.createTempReviewLikes = async ({ review_idx, users_idx, pool }) => {
  const client = await pool.connect();
  client.query(
    `
    INSERT INTO reviews.likes (
      reviews_idx,
      users_idx
    ) VALUES (
      $1,
      $2
    );
  `,
    [review_idx, users_idx]
  );
  client.release();
};

exports.getTempCodeFromDb = async ({ email, pool }) => {
  const client = await pool.connect();
  const results = await client.query(
    `
      SELECT
        code
      FROM users.codes
      WHERE email = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    [email]
  );
  client.release();

  return results.rows[0].code;
};

exports.createTempOauthReturnIdx = async ({
  provider,
  provider_user_id,
  encryptedRefreshToken,
  encryptedAccessToken,
  refreshTokenExpiresIn,
  pool,
}) => {
  const client = await pool.connect();
  const results = await client.query(
    `
    INSERT INTO users.oauth (
      provider,
      provider_user_id,
      refresh_token,
      access_token,
      refresh_expires_in
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5
    )
    RETURNING idx AS oauth_idx;
  `,
    [provider, provider_user_id, encryptedRefreshToken, encryptedAccessToken, refreshTokenExpiresIn]
  );
  client.release();

  return results.rows[0].oauth_idx;
};
