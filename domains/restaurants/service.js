// 음식점 리스트 조회
const getRestaurantInfoListFromDb = async (
  user_idx,
  category_idx,
  range,
  page,
  user_longitude,
  user_latitude,
  client
) => {
  const check_total = await client.query(
    `
      SELECT 
        COALESCE(CEIL(COUNT(list.idx) / 15::float), 1) AS total_pages
      FROM restaurants.lists AS list
      JOIN restaurants.categories AS category ON list.categories_idx = category.idx
      WHERE list.is_deleted = false
      AND category.is_deleted = false
      AND category.idx = $1
      AND ST_DWithin(
        list.location, 
        ST_SetSRID(ST_MakePoint($2, $3), 4326), 
        $4
      )
    `,
    [category_idx, user_longitude, user_latitude, range]
  );

  const results = await client.query(
    `
      SELECT 
        COALESCE(json_agg(
          json_build_object(
            'restaurant_idx', list.idx,
            'category_name', category.name,
            'restaurant_name', list.name,
            'longitude', longitude,
            'latitude', latitude,
            'address', address,
            'address_detail', address_detail,
            'phone', phone,
            'start_time', start_time,
            'end_time', end_time,
            'is_mine', CASE WHEN list.users_idx = $1 THEN true ELSE false END
          )
        ), '[]'::json) AS data
      FROM restaurants.lists AS list
      JOIN restaurants.categories AS category ON list.categories_idx = category.idx
      WHERE list.is_deleted = false
      AND category.is_deleted = false
      AND category.idx = $2
      AND ST_DWithin(
        list.location, 
        ST_SetSRID(ST_MakePoint($3, $4), 4326), 
        $5
      )
      OFFSET $6
      LIMIT 15
    `,
    [
      user_idx,
      category_idx,
      user_longitude,
      user_latitude,
      range,
      15 * (page - 1),
    ]
  );

  return {
    total_pages: check_total.rows[0].total_pages,
    data: results.rows[0]?.data || [],
  };
};

// 음식점 등록
const createRestaurantInfoAtDb = async (
  category_idx,
  user_idx,
  restaurant_name,
  latitude,
  longitude,
  address,
  address_detail,
  phone,
  start_time,
  end_time,
  client
) => {
  await client.query(
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
    `,
    [
      category_idx,
      user_idx,
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
};

// 음식점 카테고리 리스트 조회
const getRestaurantCategoryListFromDb = async (client) => {
  const results = await client.query(
    `
      SELECT
        idx AS category_idx,
        name AS category_name
      FROM restaurants.categories
      WHERE is_deleted = false;
    `
  );

  return results.rows;
};

// 음식점 카테고리 등록
const createRestaurantCategoryAtDb = async (
  user_idx,
  category_name,
  client
) => {
  await client.query(
    `
      INSERT INTO restaurants.categories (
        users_idx,
        name
      ) VALUES (
        $1,
        $2 
      )
    `,
    [user_idx, category_name]
  );
};

// 음식점 카테고리 수정
const updateRestaurantCategoryByIdxAtDb = async (
  category_idx,
  category_name,
  client
) => {
  await client.query(
    `
      UPDATE restaurants.categories
      SET name = $1
      WHERE idx = $2
      AND is_deleted = false
    `,
    [category_name, category_idx]
  );
};

// 음식점 랜덤 조회
const getRecommendRestaurantFromDb = async (
  category_idx,
  range,
  user_longitude,
  user_latitude,
  client
) => {
  const results = await client.query(
    `
    SELECT
          list.idx AS restaurant_idx,
          category.name AS category_name,
          list.name AS restaurant_name,
          longitude,
          latitude,
          address,
          address_detail,
          phone,
          start_time,
          end_time
      FROM restaurants.lists AS list
      JOIN restaurants.categories AS category ON list.categories_idx = category.idx
      WHERE list.is_deleted = false
      AND category.is_deleted = false
      AND category.idx = $1
      AND ST_DWithin(
        list.location, 
        ST_SetSRID(ST_MakePoint($2, $3), 4326), 
        $4
      )
      ORDER BY RANDOM()
      LIMIT 1
    `,
    [category_idx, user_longitude, user_latitude, range]
  );

  return results.rows[0];
};

// 음식점 메뉴 리스트 조회
const getRestaurantMenuInfoListFromDb = async (
  restaurant_idx,
  page,
  client
) => {
  const check_total = await client.query(
    `
      SELECT
        COALESCE(CEIL(COUNT(idx) / 15::float), 1) AS total_pages
      FROM menus.lists
      WHERE restaurants_idx = $1
      AND is_deleted = false
    `,
    [restaurant_idx]
  );

  //TODO:후기 등록 api 작성 후 이미지 경로 추가 필요
  const results = await client.query(
    `
      SELECT
        COALESCE(json_agg(
          json_build_object(
            'menu_idx', idx,
            'menu_name', name,
            'price', price
          )
        ), '[]'::json) AS data
      FROM menus.lists
      WHERE restaurants_idx = $1
      AND is_deleted = false
      OFFSET $2
      LIMIT 15
    `,
    [restaurant_idx, (page - 1) * 15]
  );

  return {
    total_pages: check_total.rows[0].total_pages,
    data: results.rows[0]?.data || [],
  };
};

// 음식점 메뉴 등록
const createRestaurantMenuAtDb = async (
  user_idx,
  restaurant_idx,
  menu_name,
  price,
  client
) => {
  await client.query(
    `
      INSERT INTO menus.lists (
        users_idx,
        restaurants_idx,
        name,
        price
      ) VALUES (
        $1, $2, $3, $4
      )
    `,
    [user_idx, restaurant_idx, menu_name, price]
  );
};

// 음식점 메뉴 수정
const updateRestaurantMenuByIdxAtDb = async (
  menu_idx,
  menu_name,
  price,
  client
) => {
  await client.query(
    `
      UPDATE menus.lists
      SET name = $2, price = $3
      WHERE idx = $1
      AND is_deleted = false
    `,
    [menu_idx, menu_name, price]
  );
};

// 메뉴 후기 리스트 조회
const getMenuReviewInfoListFromDb = async (menu_idx, page, client) => {
  const check_total = await client.query(
    `
      SELECT
        COALESCE(CEIL(COUNT(reviews.idx) / 15::float), 1) AS total_pages
      FROM reviews.lists reviews
      JOIN menus.lists menus ON reviews.menus_idx = menus.idx
      JOIN users.lists users ON reviews.users_idx = users.idx
      WHERE reviews.menus_idx = $1
      AND reviews.is_deleted = false
      AND menus.is_deleted = false
      AND users.is_deleted = false
    `,
    [menu_idx]
  );

  const results = await client.query(
    `
      SELECT
        COALESCE(json_agg(
          json_build_object(
            'review_idx', reviews.idx,
            'user_idx', reviews.users_idx,
            'user_name', users.nickname,
            'menu_name', menus.name,
            'content', content,
            'image_url', COALESCE(image_url, '')
          ) ORdeR BY reviews.created_at DESC
        ), '[]'::json) AS data
      FROM reviews.lists reviews
      JOIN menus.lists menus ON reviews.menus_idx = menus.idx
      JOIN users.lists users ON reviews.users_idx = users.idx
      WHERE reviews.menus_idx = $1
      AND reviews.is_deleted = false
      AND menus.is_deleted = false
      AND users.is_deleted = false
      OFFSET $2
      LIMIT 15
    `,
    [menu_idx, (page - 1) * 15]
  );

  return {
    total_pages: check_total.rows[0].total_pages,
    data: results.rows[0]?.data || [],
  };
};

// 메뉴 후기 등록
const createMenuReviewAtDb = async (user_idx, menu_idx, content, client) => {
  //TODO:이미지 컬럼 추가해야함.
  await client.query(
    `
      INSERT INTO reviews.lists (
        users_idx,
        menus_idx,
        content
      ) VALUES (
        $1, $2, $3
      )
    `,
    [user_idx, menu_idx, content]
  );
};

// 메뉴 후기 수정
const updateMenuReviewByIdxAtDb = async (review_idx, content, client) => {
  await client.query(
    `
      UPDATE reviews.lists
      SET content = $1
      WHERE idx = $2
      AND is_deleted = false
    `,
    [content, review_idx]
  );
};

// 음식점 상세보기 조회
const getRestaurantInfoByIdxFromDb = async (restaurant_idx, client) => {
  const results = await client.query(
    `
      SELECT 
        list.idx AS restaurant_idx,
        category.name AS category_name,
        list.name AS restaurant_name,
        address,
        address_detail,
        phone,
        start_time,
        end_time
      FROM restaurants.lists AS list
      JOIN restaurants.categories AS category ON list.categories_idx = category.idx
      WHERE list.idx = $1
      AND list.is_deleted = false
      AND category.is_deleted = false
    `,
    [restaurant_idx]
  );

  return results.rows[0];
};

// 음식점 수정
const updateRestaurantInfoByIdxAtDb = async (
  restaurant_idx,
  category_idx,
  restaurant_name,
  address_detail,
  phone,
  start_time,
  end_time,
  client
) => {
  await client.query(
    `
      UPDATE restaurants.lists
      SET
        categories_idx = $2,
        name = $3,
        address_detail = $4,
        phone = $5,
        start_time = $6,
        end_time = $7
      WHERE idx = $1
      AND is_deleted = false
    `,
    [
      restaurant_idx,
      category_idx,
      restaurant_name,
      address_detail,
      phone,
      start_time,
      end_time,
    ]
  );
};

module.exports = {
  getRestaurantInfoListFromDb,
  createRestaurantInfoAtDb,
  getRestaurantCategoryListFromDb,
  createRestaurantCategoryAtDb,
  updateRestaurantCategoryByIdxAtDb,
  getRecommendRestaurantFromDb,
  getRestaurantMenuInfoListFromDb,
  createRestaurantMenuAtDb,
  updateRestaurantMenuByIdxAtDb,
  getMenuReviewInfoListFromDb,
  createMenuReviewAtDb,
  updateMenuReviewByIdxAtDb,
  getRestaurantInfoByIdxFromDb,
  updateRestaurantInfoByIdxAtDb,
};
