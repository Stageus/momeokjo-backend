// 내 정보 수정
exports.updateMyInfoAtDb = async (user_idx, nickname, client) => {
  await client.query(
    `
      UPDATE users.lists SET 
        nickname = $1 
      WHERE idx = $2
      AND is_deleted = false;
    `,
    [nickname, user_idx]
  );
};

// 사용자 정보 상세정보 조회
exports.getUserInfoByIdxFromDb = async (user_idx_from_cookie, user_idx, client) => {
  const results = await client.query(
    `
      SELECT
        nickname,
        CASE
          WHEN idx = $1 THEN true
          ELSE false
        END AS is_mine
      FROM users.lists
      WHERE idx = $2
      AND is_deleted = false;
    `,
    [user_idx_from_cookie, user_idx]
  );

  return results.rows[0];
};

// 사용자가 즐겨찾기 등록한 음식점 리스트 조회
exports.getRestaurantLikeListFromDb = async (client, user_idx_from_cookie, user_idx, page) => {
  const check_total = await client.query(
    `
      SELECT COALESCE(CEIL(COUNT(*) / 15::float), 1) AS total_pages
      FROM restaurants.lists list
      JOIN restaurants.likes likes ON likes.restaurants_idx = list.idx
      WHERE likes.users_idx = $1
      AND list.is_deleted = false
      AND likes.is_deleted = false;
      `,
    [user_idx]
  );

  const results = await client.query(
    `
      WITH total_likes AS (
        SELECT COUNT(*) AS likes_count,
        restaurants_idx
        FROM restaurants.likes
        WHERE is_deleted = false
        AND users_idx = $2
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
            'is_my_like', CASE WHEN list.users_idx = $1 THEN true ELSE false END
          )
        ), '[]'::json) AS data
      FROM restaurants.lists list
      JOIN restaurants.categories category ON category.idx = list.categories_idx
      JOIN restaurants.likes likes ON likes.restaurants_idx = list.idx
      JOIN total_likes total ON total.restaurants_idx = list.idx
      WHERE likes.users_idx = $2 
      AND likes.is_deleted = false
      AND likes.is_deleted = false
      OFFSET $3
      LIMIT 15;
    `,
    [user_idx_from_cookie, user_idx, 15 * (page - 1)]
  );

  return { data: results.rows[0].data || [], total_pages: check_total.rows[0].total_pages };
};

// 음식점 즐겨찾기 등록
exports.createRestaurantLikeAtDb = async (user_idx, restaurant_idx, client) => {
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
    [restaurant_idx, user_idx]
  );
};

// 음식점 즐겨찾기 해제
exports.deleteRestaurantLikeFromDb = async (client, restaurant_idx, user_idx) => {
  let query = `
      UPDATE restaurants.likes SET
        is_deleted = true
      WHERE restaurants_idx = $1
      AND is_deleted = false`;

  let values = [restaurant_idx];

  if (!user_idx) {
    query += ` AND users_idx = $2`;
    values.push(user_idx);
  }

  await client.query(query, values);
};

// 메뉴 추천 등록
exports.createMenuLikeAtDb = async (user_idx, menu_idx, client) => {
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
    [menu_idx, user_idx]
  );
};

// 메뉴 추천 해제
exports.deleteMenuLikeFromDb = async (client, menu_idx, user_idx) => {
  let query = `
    UPDATE menus.likes SET
      is_deleted = true
    WHERE menus_idx = ANY(STRING_TO_ARRAY($1, ',')::BIGINT[])
    AND is_deleted = false`;

  let values = [menu_idx];

  if (user_idx) {
    query += ` AND users_idx = $2`;
    values.push(user_idx);
  }

  await client.query(query, values);
};

// 후기 좋아요 등록
exports.createReviewLikeAtDb = async (user_idx, review_idx, client) => {
  await client.query(
    `
      INSERT INTO reviews.likes (
        reviews_idx,
        users_idx
      ) VALUES (
        $1,
        $2
      );
    `,
    [review_idx, user_idx]
  );
};

// 후괴 좋아요 해제
exports.deleteReviewLikeFromDb = async (client, review_idx, user_idx) => {
  let query = `
    UPDATE reviews.likes SET
      is_deleted = true
    WHERE reviews_idx = ANY(STRING_TO_ARRAY($1, ',')::BIGINT[])
    AND is_deleted = false`;

  let values = [review_idx];

  if (user_idx) {
    query += ` AND users_idx = $2`;
    values.push(user_idx);
  }

  await client.query(query, values);
};

// 음식점 신고 등록
exports.createRestaurantReportAtDb = async (client, restaurant_idx, user_idx) => {
  await client.query(
    `
      INSERT INTO restaurants.reports (
        restaurants_idx,
        users_idx
      ) VALUES (
        $1,
        $2
      );
    `,
    [restaurant_idx, user_idx]
  );
};

// 총 음식점 신고 횟수 조회
exports.checkTotalRestaurantReportByIdx = async (client, restaurant_idx) => {
  const results = await client.query(
    `
      SELECT COUNT(report.*) AS total_count
      FROM restaurants.reports AS report
      JOIN restaurants.lists AS list ON report.restaurants_idx = list.idx
      WHERE report.restaurants_idx = $1
      AND list.is_deleted = false;
    `,
    [restaurant_idx]
  );

  return results.rows[0].total_count ?? 0;
};

// 음식점 비활성화
exports.deleteRestaurantFromDb = async (client, restaurant_idx) => {
  await client.query(
    `
      UPDATE restaurants.lists SET
        is_deleted = true
      WHERE idx = $1
      AND is_deleted = false;
    `,
    [restaurant_idx]
  );
};

// 메뉴 비활성화
exports.deleteMenuFromDb = async (client, type, idx) => {
  let query = `
      UPDATE menus.lists SET
        is_deleted = true
      WHERE is_deleted = false
    `;

  if (type === "restaurant") {
    query += ` AND restaurants_idx = $1`;
  } else {
    query += ` AND idx = $1`;
  }

  query += ` RETURNING idx`;

  const results = await client.query(query, [idx]);

  return results.rows.map(({ idx }) => idx).join(",");
};

// 후기 비활성화
exports.deleteReviewFromDb = async (client, type, index) => {
  let query = `
      UPDATE reviews.lists SET
        is_deleted = true
      WHERE is_deleted = false
    `;

  if (type === "menu") {
    query += ` AND menus_idx = ANY(STRING_TO_ARRAY($1, ',')::BIGINT[])`;
  } else {
    query += ` AND idx = ANY(STRING_TO_ARRAY($1, ',')::BIGINT[])`;
  }

  query += ` RETURNING idx`;

  const results = await client.query(query, [index]);

  return results.rows.map(({ idx }) => idx).join(",");
};

// 메뉴 신고 등록
exports.createMenuReportAtDb = async (client, menu_idx, user_idx) => {
  await client.query(
    `
      INSERT INTO menus.reports (
        menus_idx,
        users_idx
      ) VALUES (
        $1,
        $2
      );
    `,
    [menu_idx, user_idx]
  );
};

// 총 메뉴 신고 횟수 조회
exports.checkTotalMenuReportByIdx = async (client, menu_idx) => {
  const results = await client.query(
    `
      SELECT COUNT(report.*) AS total_count
      FROM menus.reports AS report
      JOIN menus.lists AS list ON report.menus_idx = list.idx
      WHERE report.menus_idx = $1
      AND list.is_deleted = false;
    `,
    [menu_idx]
  );

  return results.rows[0].total_count ?? 0;
};

// 후기 신고 등록
exports.createReviewReportAtDb = async (client, review_idx, user_idx) => {
  await client.query(
    `
      INSERT INTO reviews.reports (
        reviews_idx,
        users_idx
      ) VALUES (
        $1,
        $2
      );
    `,
    [review_idx, user_idx]
  );
};

// 총 후기 신고 횟수 조회
exports.checkTotalReviewReportByIdx = async (client, review_idx) => {
  const results = await client.query(
    `
      SELECT COUNT(report.*) AS total_count
      FROM reviews.reports AS report
      JOIN reviews.lists AS list ON report.reviews_idx = list.idx
      WHERE report.reviews_idx = $1
      AND list.is_deleted = false;
    `,
    [review_idx]
  );

  return results.rows[0].total_count ?? 0;
};
