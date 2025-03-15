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
      WITH likes AS (
        SELECT COUNT(*) AS likes_count,
        restaurants_idx
        FROM restaurants.likes
        WHERE is_deleted = false
        GROUP BY restaurants_idx
      )

      SELECT 
        COALESCE(json_agg(
          json_build_object(
            'restaurant_idx', list.idx,
            'category_name', category.name,
            'likes_count', COALESCE(likes_count::integer , 0),
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
      LEFT JOIN likes ON list.idx = likes.restaurants_idx
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
const getRestaurantCategoryListFromDb = async (include_deleted, client) => {
  const results = await client.query(
    `
      SELECT
        idx AS category_idx,
        name AS category_name
      FROM restaurants.categories
      WHERE (is_deleted = false OR true = $1);
    `,
    [include_deleted]
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
  user_idx,
  category_idx,
  range,
  user_longitude,
  user_latitude,
  client
) => {
  const results = await client.query(
    `
    WITH likes AS (
      SELECT COUNT(*) AS likes_count,
      restaurants_idx
      FROM restaurants.likes
      WHERE is_deleted = false
      GROUP BY restaurants_idx
    )

    SELECT
          list.idx AS restaurant_idx,
          category.name AS category_name,
          COALESCE(likes_count::integer , 0) AS likes_count,
          list.name AS restaurant_name,
          longitude,
          latitude,
          address,
          address_detail,
          phone,
          start_time,
          end_time,
          CASE WHEN list.users_idx = $1 THEN true ELSE false END AS is_mine
      FROM restaurants.lists AS list
      JOIN restaurants.categories AS category ON list.categories_idx = category.idx
      LEFT JOIN likes ON list.idx = likes.restaurants_idx
      WHERE list.is_deleted = false
      AND category.is_deleted = false
      AND category.idx = $2
      AND ST_DWithin(
        list.location, 
        ST_SetSRID(ST_MakePoint($3, $4), 4326), 
        $5
      )
      ORDER BY RANDOM()
      LIMIT 1
    `,
    [user_idx, category_idx, user_longitude, user_latitude, range]
  );

  return results.rows[0] ?? {};
};

// 음식점 메뉴 리스트 조회
const getRestaurantMenuInfoListFromDb = async (
  user_idx,
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

  //TODO:MERGE 후 main branch에서 erd 수정 및 데이터베이스 테이블 컬럼 추가(restaurants_idx)
  const results = await client.query(
    `
      WITH likes AS (
        SELECT COUNT(*) AS likes_count,
        menus_idx
        FROM menus.likes
        WHERE is_deleted = false
        GROUP BY menus_idx
      ),
      images AS (
        SELECT
          reviews.menus_idx,
          reviews.image_url
        FROM reviews.lists AS reviews
        JOIN menus.lists AS menus ON reviews.menus_idx = menus.idx
        LEFT JOIN likes ON reviews.menus_idx = likes.menus_idx
        WHERE restaurants_idx = $2
        AND reviews.is_deleted = false
        AND menus.is_deleted = false
        ORDER BY likes.likes_count DESC
        LIMIT 1
      ) 

      SELECT
        COALESCE(json_agg(
          json_build_object(
            'menu_idx', idx,
            'menu_name', name,
            'price', price,
            'likes_count', COALESCE(likes_count::integer, 0),
            'is_mine', CASE WHEN users_idx = $1 THEN true ELSE false END,
            'image_url', COALESCE(images.image_url, '')
          )
        ), '[]'::json) AS data
      FROM menus.lists AS list
      LEFT JOIN likes ON list.idx = likes.menus_idx
      LEFT JOIN images ON list.idx = images.menus_idx
      WHERE restaurants_idx = $2
      AND is_deleted = false
      OFFSET $3
      LIMIT 15
    `,
    [user_idx, restaurant_idx, (page - 1) * 15]
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
const getMenuReviewInfoListFromDb = async (
  user_idx,
  menu_idx,
  page,
  client
) => {
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
      WITH likes AS (
        SELECT COUNT(*) AS likes_count,
        reviews_idx
        FROM reviews.likes
        WHERE is_deleted = false
        GROUP BY reviews_idx
      )

      SELECT
        COALESCE(json_agg(
          json_build_object(
            'review_idx', reviews.idx,
            'user_idx', reviews.users_idx,
            'user_name', users.nickname,
            'menu_name', menus.name,
            'content', reviews.content,
            'image_url', COALESCE(reviews.image_url, ''),
            'is_mine', CASE WHEN reviews.users_idx = $1 THEN true ELSE false END,
            'likes_count', COALESCE(likes.likes_count::integer, 0)
          ) ORDER BY reviews.created_at DESC
        ), '[]'::json) AS data
      FROM reviews.lists reviews
      JOIN menus.lists menus ON reviews.menus_idx = menus.idx
      JOIN users.lists users ON reviews.users_idx = users.idx
      LEFT JOIN likes ON reviews.idx = likes.reviews_idx
      WHERE reviews.menus_idx = $2
      AND reviews.is_deleted = false
      AND menus.is_deleted = false
      AND users.is_deleted = false
      OFFSET $3
      LIMIT 15
    `,
    [user_idx, menu_idx, (page - 1) * 15]
  );

  return {
    total_pages: check_total.rows[0].total_pages,
    data: results.rows[0]?.data || [],
  };
};

// 메뉴 후기 등록
const createMenuReviewAtDb = async (
  user_idx,
  menu_idx,
  content,
  image_url,
  client
) => {
  //TODO:이미지 컬럼 추가해야함.
  await client.query(
    `
      INSERT INTO reviews.lists (
        users_idx,
        menus_idx,
        content,
        image_url
      ) VALUES (
        $1, $2, $3, $4
      )
    `,
    [user_idx, menu_idx, content, image_url]
  );
};

// 메뉴 후기 수정
const updateMenuReviewByIdxAtDb = async (
  user_idx,
  review_idx,
  content,
  image_url,
  client
) => {
  await client.query(
    `
      UPDATE reviews.lists
      SET content = $1,
        image_url = CASE WHEN CAST($2 AS VARCHAR(255)) IS NOT NULL THEN $2 ELSE null END
      WHERE idx = $3
      AND is_deleted = false
      AND users_idx = $4
    `,
    [content, image_url, review_idx, user_idx]
  );
};

// 음식점 상세보기 조회
const getRestaurantInfoByIdxFromDb = async (
  user_idx,
  restaurant_idx,
  client
) => {
  const results = await client.query(
    `
      WITH likes AS (
        SELECT COUNT(*) AS likes_count,
        restaurants_idx
        FROM restaurants.likes
        WHERE is_deleted = false
        GROUP BY restaurants_idx
      )
      
      SELECT 
        list.idx AS restaurant_idx,
        category.name AS category_name,
        COALESCE(likes_count::integer , 0) AS likes_count,
        list.name AS restaurant_name,
        address,
        address_detail,
        phone,
        start_time,
        end_time,
        CASE WHEN list.users_idx = $1 THEN true ELSE false END AS is_mine
      FROM restaurants.lists AS list
      JOIN restaurants.categories AS category ON list.categories_idx = category.idx
      LEFT JOIN likes ON list.idx = likes.restaurants_idx
      WHERE list.idx = $2
      AND list.is_deleted = false
      AND category.is_deleted = false
    `,
    [user_idx, restaurant_idx]
  );

  return results.rows[0] || {};
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
