// 음식점 리스트 조회
exports.getRestaurantInfoListFromDb = async ({
  users_idx,
  category_idx,
  range,
  page,
  longitude,
  latitude,
  client,
}) => {
  const check_total = await client.query(
    `
      SELECT 
        COALESCE(CEIL(COUNT(list.idx) / 15::float), 1) AS total_pages
      FROM restaurants.lists AS list
      JOIN restaurants.categories AS category ON list.categories_idx = category.idx
      WHERE list.is_deleted = false
      AND category.is_deleted = false
      AND (
        $1::INTEGER IS NULL OR category.idx = $1
      )
      AND ST_DWithin(
        list.location::geography,
        ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
        $4
      )
    `,
    [category_idx, longitude, latitude, range]
  );

  const results = await client.query(
    `
      WITH tot_likes AS (
        SELECT 
          COUNT(*) AS likes_count,
          restaurants_idx
        FROM restaurants.likes
        WHERE is_deleted = false
        GROUP BY restaurants_idx
      )

      SELECT 
        COALESCE(json_agg(
          json_build_object(
            'restaurants_idx', list.idx,
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
            'is_mine', CASE WHEN list.users_idx = $1 THEN true ELSE false END,
            'is_my_likes', CASE WHEN likes.users_idx = $1 THEN true ELSE false END
          )
        ), '[]'::json) AS data
      FROM restaurants.lists AS list
      JOIN restaurants.categories AS category ON list.categories_idx = category.idx
      LEFT JOIN tot_likes ON list.idx = tot_likes.restaurants_idx
      LEFT JOIN restaurants.likes likes ON list.idx = likes.restaurants_idx
      WHERE list.is_deleted = false
      AND category.is_deleted = false
      AND (
        $2::INTEGER IS NULL OR category.idx = $2
      )
      AND ST_DWithin(
        list.location::geography, 
        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 
        $5
      )
      OFFSET $6
      LIMIT 15
    `,
    [users_idx, category_idx, longitude, latitude, range, 15 * (page - 1)]
  );

  return {
    total_pages: check_total.rows[0].total_pages,
    data: results.rows[0]?.data || [],
  };
};

// 음식점 등록
exports.createRestaurantInfoAtDb = async ({
  category_idx,
  users_idx,
  restaurant_name,
  latitude,
  longitude,
  address,
  address_detail,
  phone,
  start_time,
  end_time,
  client,
}) => {
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
};

// 음식점 카테고리 리스트 조회
exports.getRestaurantCategoryListFromDb = async ({ include_deleted, client }) => {
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
exports.createRestaurantCategoryAtDb = async ({ users_idx, category_name, client }) => {
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
    [users_idx, category_name]
  );
};

// 음식점 카테고리 수정
exports.updateRestaurantCategoryByIdxAtDb = async ({ category_idx, category_name, client }) => {
  const results = await client.query(
    `
      UPDATE restaurants.categories
      SET name = $1
      WHERE idx = $2
      AND is_deleted = false
      RETURNING idx AS category_idx
    `,
    [category_name, category_idx]
  );

  return results.rows[0]?.category_idx;
};

// 음식점 랜덤 조회
exports.getRecommendRestaurantFromDb = async ({
  users_idx,
  category_idx,
  range,
  longitude,
  latitude,
  client,
}) => {
  const results = await client.query(
    `
    WITH tot_likes AS (
      SELECT COUNT(*) AS likes_count,
      restaurants_idx
      FROM restaurants.likes
      WHERE is_deleted = false
      GROUP BY restaurants_idx
    )

    SELECT
          list.idx AS restaurants_idx,
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
          CASE WHEN list.users_idx = $1 THEN true ELSE false END AS is_mine,
          CASE WHEN likes.users_idx = $1 THEN true ELSE false END AS is_my_like
      FROM restaurants.lists AS list
      JOIN restaurants.categories AS category ON list.categories_idx = category.idx
      LEFT JOIN tot_likes ON list.idx = tot_likes.restaurants_idx
      LEFT JOIN restaurants.likes likes ON list.idx = likes.restaurants_idx
      WHERE list.is_deleted = false
      AND category.is_deleted = false
      AND (
        $2::INTEGER IS NULL OR category.idx = $2
      )
      AND ST_DWithin(
        list.location::geography, 
        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 
        $5
      )
      ORDER BY RANDOM()
      LIMIT 1
    `,
    [users_idx, category_idx, longitude, latitude, range]
  );

  return results.rows[0] ?? {};
};

// 음식점 메뉴 리스트 조회
exports.getRestaurantMenuInfoListFromDb = async ({ users_idx, restaurants_idx, page, client }) => {
  const check_total = await client.query(
    `
      SELECT
        COALESCE(CEIL(COUNT(idx) / 15::float), 1) AS total_pages
      FROM menus.lists
      WHERE restaurants_idx = $1
      AND is_deleted = false
    `,
    [restaurants_idx]
  );

  const results = await client.query(
    `
      WITH tot_likes AS (
        SELECT 
          COUNT(*) AS likes_count,
          menus_idx
        FROM menus.likes
        WHERE is_deleted = false
        GROUP BY menus_idx
      ),
      images AS (
        SELECT
          reviews.menus_idx,
          reviews.image_url
        FROM reviews.lists reviews
        JOIN menus.lists menus ON reviews.menus_idx = menus.idx
        LEFT JOIN tot_likes ON reviews.menus_idx = tot_likes.menus_idx
        WHERE reviews.restaurants_idx = $2
        AND reviews.is_deleted = false
        AND menus.is_deleted = false
        ORDER BY tot_likes.likes_count DESC
        LIMIT 1
      ) 

      SELECT
        COALESCE(json_agg(
          json_build_object(
            'menu_idx', list.idx,
            'menu_name', name,
            'price', price,
            'likes_count', COALESCE(likes_count::integer, 0),
            'is_mine', CASE WHEN list.users_idx = $1 THEN true ELSE false END,
            'is_my_like', CASE WHEN likes.users_idx = $1 THEN true ELSE false END,
            'image_url', COALESCE(images.image_url, '')
          )
        ), '[]'::json) AS data
      FROM menus.lists list
      LEFT JOIN tot_likes ON list.idx = tot_likes.menus_idx
      LEFT JOIN menus.likes likes ON list.idx = likes.menus_idx
      LEFT JOIN images ON list.idx = images.menus_idx
      WHERE restaurants_idx = $2
      AND list.is_deleted = false
      OFFSET $3
      LIMIT 15
    `,
    [users_idx, restaurants_idx, (page - 1) * 15]
  );

  return {
    total_pages: check_total.rows[0].total_pages,
    data: results.rows[0]?.data || [],
  };
};

// 음식점 메뉴 등록
exports.createRestaurantMenuAtDb = async ({
  users_idx,
  restaurants_idx,
  menu_name,
  price,
  client,
}) => {
  await client.query(
    `
      INSERT INTO menus.lists (
        users_idx,
        restaurants_idx,
        name,
        price
      ) VALUES (
        $1, $2, $3, $4
      );
    `,
    [users_idx, restaurants_idx, menu_name, price]
  );
};

// 음식점 메뉴 수정
exports.updateRestaurantMenuByIdxAtDb = async ({
  users_idx,
  menus_idx,
  menu_name,
  price,
  client,
}) => {
  const results = await client.query(
    `
      UPDATE menus.lists
      SET name = $1, price = $2
      WHERE idx = $3
      AND users_idx = $4
      AND is_deleted = false
      RETURNING idx;
    `,
    [menu_name, price, menus_idx, users_idx]
  );

  return results.rowCount > 0;
};

// 메뉴 후기 리스트 조회
exports.getMenuReviewInfoListFromDb = async ({ users_idx, menus_idx, page, client }) => {
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
    [menus_idx]
  );

  const results = await client.query(
    `
      WITH tot_likes AS (
        SELECT COUNT(*) AS likes_count,
        reviews_idx
        FROM reviews.likes
        WHERE is_deleted = false
        GROUP BY reviews_idx
      )

      SELECT
        COALESCE(json_agg(
          json_build_object(
            'reviews_idx', reviews.idx,
            'users_idx', reviews.users_idx,
            'user_name', users.nickname,
            'menu_name', menus.name,
            'content', reviews.content,
            'image_url', COALESCE(reviews.image_url, ''),
            'is_mine', CASE WHEN reviews.users_idx = $1 THEN true ELSE false END,
            'is_my_like', CASE WHEN likes.users_idx = $1 THEN true ELSE false END,
            'likes_count', COALESCE(tot_likes.likes_count::integer, 0)
          ) ORDER BY reviews.created_at DESC
        ), '[]'::json) AS data
      FROM reviews.lists reviews
      JOIN menus.lists menus ON reviews.menus_idx = menus.idx
      JOIN users.lists users ON reviews.users_idx = users.idx
      LEFT JOIN tot_likes ON reviews.idx = tot_likes.reviews_idx
      LEFT JOIN reviews.likes likes ON reviews.idx = likes.reviews_idx
      WHERE reviews.menus_idx = $2
      AND reviews.is_deleted = false
      AND menus.is_deleted = false
      AND users.is_deleted = false
      OFFSET $3
      LIMIT 15
    `,
    [users_idx, menus_idx, (page - 1) * 15]
  );

  return {
    total_pages: check_total.rows[0].total_pages,
    data: results.rows[0]?.data || [],
  };
};

// 메뉴 후기 등록
exports.createMenuReviewAtDb = async ({
  users_idx,
  menus_idx,
  content,
  image_url,
  restaurants_idx,
  client,
}) => {
  await client.query(
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
    `,
    [users_idx, menus_idx, content, image_url, restaurants_idx]
  );
};

// 메뉴 후기 수정
exports.updateMenuReviewByIdxAtDb = async ({
  users_idx,
  reviews_idx,
  content,
  image_url,
  client,
}) => {
  const results = await client.query(
    `
      UPDATE reviews.lists
      SET content = $1,
        image_url = CASE WHEN CAST($2 AS VARCHAR(255)) IS NOT NULL THEN $2 ELSE null END
      WHERE idx = $3
      AND is_deleted = false
      AND users_idx = $4
      RETURNING idx;
    `,
    [content, image_url, reviews_idx, users_idx]
  );

  return results.rowCount > 0;
};

// 음식점 상세보기 조회
exports.getRestaurantInfoByIdxFromDb = async ({ users_idx, restaurants_idx, client }) => {
  const results = await client.query(
    `
      WITH tot_likes AS (
        SELECT COUNT(*) AS likes_count,
        restaurants_idx
        FROM restaurants.likes
        WHERE is_deleted = false
        GROUP BY restaurants_idx
      )
      
      SELECT 
        list.idx AS restaurants_idx,
        category.name AS category_name,
        COALESCE(likes_count::integer , 0) AS likes_count,
        list.name AS restaurant_name,
        address,
        address_detail,
        phone,
        start_time,
        end_time,
        CASE WHEN list.users_idx = $1 THEN true ELSE false END AS is_mine,
        CASE WHEN likes.users_idx = $1 THEN true ELSE false END AS is_my_like
      FROM restaurants.lists AS list
      JOIN restaurants.categories AS category ON list.categories_idx = category.idx
      LEFT JOIN tot_likes ON list.idx = tot_likes.restaurants_idx
      LEFT JOIN restaurants.likes likes ON list.idx = likes.restaurants_idx
      WHERE list.idx = $2
      AND list.is_deleted = false
      AND category.is_deleted = false
    `,
    [users_idx, restaurants_idx]
  );

  return results.rows[0] || {};
};

// 음식점 수정
exports.updateRestaurantInfoByIdxAtDb = async ({
  users_idx,
  restaurants_idx,
  category_idx,
  restaurant_name,
  address_detail,
  phone,
  start_time,
  end_time,
  client,
}) => {
  const results = await client.query(
    `
      UPDATE restaurants.lists
      SET
        categories_idx = $1,
        name = $2,
        address_detail = $3,
        phone = $4,
        start_time = $5,
        end_time = $6
      WHERE idx = $7
      AND users_idx = $8
      AND is_deleted = false
      RETURNING idx;
    `,
    [
      category_idx,
      restaurant_name,
      address_detail,
      phone,
      start_time,
      end_time,
      restaurants_idx,
      users_idx,
    ]
  );

  return results.rowCount > 0;
};
