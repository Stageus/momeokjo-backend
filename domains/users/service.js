// 내 정보 수정
exports.updateMyInfoAtDb = async ({ users_idx, nickname, client }) => {
  const results = await client.query(
    `
      UPDATE users.lists SET 
        nickname = $1 
      WHERE idx = $2
      AND is_deleted = false
      RETURNING idx;
    `,
    [nickname, users_idx]
  );

  return results.rowCount > 0;
};

// 사용자 정보 상세정보 조회
exports.getUserInfoByIdxFromDb = async ({ users_idx_from_cookie, users_idx, client }) => {
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
    [users_idx_from_cookie, users_idx]
  );

  return results.rows[0];
};

// 사용자가 즐겨찾기 등록한 음식점 리스트 조회
exports.getRestaurantLikeListFromDb = async ({
  client,
  users_idx_from_cookie,
  users_idx,
  page,
}) => {
  const check_total = await client.query(
    `
      SELECT COALESCE(CEIL(COUNT(*) / 15::float), 1) AS total_pages
      FROM restaurants.lists list
      JOIN restaurants.likes likes ON likes.restaurants_idx = list.idx
      WHERE likes.users_idx = $1
      AND list.is_deleted = false
      AND likes.is_deleted = false;
      `,
    [users_idx]
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
            'is_my_like', CASE WHEN likes.users_idx = $1 THEN true ELSE false END
          )
        ), '[]'::json) AS data
      FROM restaurants.lists list
      JOIN restaurants.categories category ON category.idx = list.categories_idx
      LEFT JOIN restaurants.likes likes ON likes.restaurants_idx = list.idx
      LEFT JOIN total_likes total ON total.restaurants_idx = list.idx
      WHERE likes.users_idx = $2 
      AND list.is_deleted = false
      AND likes.is_deleted = false
      OFFSET $3
      LIMIT 15;
    `,
    [users_idx_from_cookie, users_idx, 15 * (page - 1)]
  );

  return { data: results.rows[0]?.data ?? [], total_pages: check_total.rows[0].total_pages };
};

exports.getReviewListFromDb = async ({ client, users_idx_from_cookie, users_idx, page }) => {
  const check_total = await client.query(
    `
      SELECT COALESCE(CEIL(COUNT(reviews.*) / 15::float), 1) AS total_pages
      FROM reviews.lists reviews
      JOIN menus.lists menus ON reviews.menus_idx = menus.idx
      JOIN users.lists users ON reviews.users_idx = users.idx
      WHERE reviews.users_idx = $1
      AND reviews.is_deleted = false
      AND users.is_deleted = false
      AND menus.is_deleted = false;
      `,
    [users_idx]
  );

  const results = await client.query(
    `
    WITH total_likes AS (
        SELECT COUNT(likes.*) AS likes_count,
        reviews_idx
        FROM reviews.likes likes
        JOIN reviews.lists reviews ON likes.reviews_idx = reviews.idx
        JOIN users.lists users ON likes.users_idx = users.idx
        WHERE likes.users_idx = $2 
        AND likes.is_deleted = false
        AND reviews.is_deleted = false
        AND users.is_deleted = false
        GROUP BY reviews_idx
      )

      SELECT
        COALESCE(json_agg(
          json_build_object(
            'review_idx', reviews.idx,
            'menu_name', menus.name,
            'likes_count', COALESCE(likes_count::integer , 0),
            'users_idx', reviews.users_idx,
            'nickname', nickname,
            'content', content,
            'image_url', image_url,
            'created_at', reviews.created_at,
            'is_my_like', CASE WHEN likes.users_idx = $1 THEN true ELSE false END
          )
        ), '[]'::json) AS data
      FROM reviews.lists reviews
      JOIN menus.lists menus ON reviews.menus_idx = menus.idx
      JOIN users.lists users ON reviews.users_idx = users.idx
      LEFT JOIN total_likes total ON total.reviews_idx = reviews.idx
      LEFT JOIN reviews.likes likes ON likes.reviews_idx = reviews.idx
      WHERE reviews.users_idx = $2 
      AND reviews.is_deleted = false
      AND users.is_deleted = false
      AND menus.is_deleted = false
      OFFSET $3
      LIMIT 15;
      `,
    [users_idx_from_cookie, users_idx, 15 * (page - 1)]
  );

  return { data: results.rows[0]?.data ?? [], total_pages: check_total.rows[0].total_pages };
};

// 음식점 즐겨찾기 등록
exports.createRestaurantLikeAtDb = async ({ users_idx, restaurants_idx, client }) => {
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
};

// 음식점 즐겨찾기 해제
exports.deleteRestaurantLikeFromDb = async ({ client, restaurants_idx, users_idx = null }) => {
  const results = await client.query(
    `
      UPDATE restaurants.likes SET
        is_deleted = true
      WHERE restaurants_idx = $1
        AND is_deleted = false
        AND (
          $2::INTEGER IS NULL OR users_idx = $2
        )
      RETURNING idx;
    `,
    [restaurants_idx, users_idx]
  );

  return results.rowCount > 0;
};

// 메뉴 추천 등록
exports.createMenuLikeAtDb = async ({ users_idx, menus_idx, client }) => {
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
    [menus_idx, users_idx]
  );
};

// 메뉴 추천 해제
exports.deleteMenuLikeFromDb = async ({ client, menus_idx, users_idx }) => {
  const results = await client.query(
    `
      UPDATE menus.likes SET
        is_deleted = true
      WHERE menus_idx = $1
        AND users_idx = $2
        AND is_deleted = false
      RETURNING idx;
    `,
    [menus_idx, users_idx]
  );

  return results.rowCount > 0;
};

// 메뉴 추천 해제
exports.deleteMenuLikeFromDbWithArray = async ({ client, menus_idx_list }) => {
  await client.query(
    `
      UPDATE menus.likes SET
        is_deleted = true
      WHERE menus_idx = ANY($1::int[])
        AND is_deleted = false;
    `,
    [menus_idx_list]
  );
};

// 후기 좋아요 등록
exports.createReviewLikeAtDb = async ({ users_idx, reviews_idx, client }) => {
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
    [reviews_idx, users_idx]
  );
};

// 후기 좋아요 해제
exports.deleteReviewLikeFromDb = async ({ client, reviews_idx, users_idx }) => {
  const results = await client.query(
    `
      UPDATE reviews.likes SET
        is_deleted = true
      WHERE reviews_idx = $1
        AND users_idx = $2
        AND is_deleted = false
      RETURNING idx;
    `,
    [reviews_idx, users_idx]
  );

  return results.rowCount > 0;
};

exports.deleteReviewLikeFromDbWithArray = async ({ client, reviews_idx_list }) => {
  await client.query(
    `
      UPDATE reviews.likes SET
        is_deleted = true
      WHERE reviews_idx = ANY($1::int[])
      AND is_deleted = false;
    `,
    [reviews_idx_list]
  );
};

// 음식점 신고 등록
exports.createRestaurantReportAtDb = async ({ client, restaurants_idx, users_idx }) => {
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
    [restaurants_idx, users_idx]
  );
};

// 총 음식점 신고 횟수 조회
exports.getTotalRestaurantReportByIdx = async ({ client, restaurants_idx }) => {
  const results = await client.query(
    `
      SELECT COUNT(*) AS total_count
      FROM restaurants.reports
      WHERE restaurants_idx = $1;
    `,
    [restaurants_idx]
  );

  return results.rows[0]?.total_count ?? 0;
};

// 음식점 비활성화
exports.deleteRestaurantFromDb = async ({ client, restaurants_idx }) => {
  await client.query(
    `
      UPDATE restaurants.lists SET
        is_deleted = true
      WHERE idx = $1
      AND is_deleted = false;
    `,
    [restaurants_idx]
  );
};

// 메뉴 비활성화
exports.deleteMenuFromDbByRestaurantsIdx = async ({ client, restaurants_idx }) => {
  const results = await client.query(
    `
      UPDATE menus.lists SET
        is_deleted = true
      WHERE restaurants_idx = $1
        AND is_deleted = false
      RETURNING idx;
    `,
    [restaurants_idx]
  );

  return results.rows.map(({ idx }) => parseInt(idx));
};

exports.deleteMenuFromDbByMenusIdx = async ({ client, menus_idx }) => {
  const results = await client.query(
    `
      UPDATE menus.lists SET
        is_deleted = true
      WHERE idx = $1
        AND is_deleted = false
      RETURNING idx;
    `,
    [menus_idx]
  );

  return results.rows.map(({ idx }) => parseInt(idx));
};

// 후기 비활성화
exports.deleteReviewFromDbByRestaurantsIdx = async ({ client, restaurants_idx }) => {
  const results = await client.query(
    `
      UPDATE reviews.lists SET
        is_deleted = true
      WHERE restaurants_idx = $1
        AND is_deleted = false;
    `,
    [restaurants_idx]
  );

  return results.rows?.map(({ idx }) => parseInt(idx)) ?? [];
};

exports.deleteReviewFromDbByMenusIdx = async ({ client, menus_idx }) => {
  const results = await client.query(
    `
      UPDATE reviews.lists SET
        is_deleted = true
      WHERE menus_idx = $1
        AND is_deleted = false;
    `,
    [menus_idx]
  );

  return results.rows.map(({ idx }) => parseInt(idx));
};

exports.deleteReviewFromDbByReviewsIdx = async ({ client, reviews_idx }) => {
  const results = await client.query(
    `
      UPDATE reviews.lists SET
        is_deleted = true
      WHERE idx = $1
        AND is_deleted = false;
    `,
    [reviews_idx]
  );

  return results.rows?.map(({ idx }) => parseInt(idx)) ?? [];
};

// 메뉴 신고 등록
exports.createMenuReportAtDb = async ({ client, menus_idx, users_idx }) => {
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
    [menus_idx, users_idx]
  );
};

// 총 메뉴 신고 횟수 조회
exports.checkTotalMenuReportByIdx = async ({ client, menus_idx }) => {
  const results = await client.query(
    `
      SELECT COUNT(*) AS total_count
      FROM menus.reports
      WHERE menus_idx = $1;
    `,
    [menus_idx]
  );

  return results.rows[0]?.total_count ?? 0;
};

// 후기 신고 등록
exports.createReviewReportAtDb = async ({ client, reviews_idx, users_idx }) => {
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
    [reviews_idx, users_idx]
  );
};

// 총 후기 신고 횟수 조회
exports.checkTotalReviewReportByIdx = async ({ client, reviews_idx }) => {
  const results = await client.query(
    `
      SELECT COUNT(*) AS total_count
      FROM reviews.reports
      WHERE reviews_idx = $1;
    `,
    [reviews_idx]
  );

  return results.rows[0]?.total_count ?? 0;
};
