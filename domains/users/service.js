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
exports.deleteReviewFromDb = async (client, review_idx_list) => {
  const results = await client.query(
    `
      UPDATE reviews.lists SET
        is_deleted = true
      WHERE menus_idx = ANY(STRING_TO_ARRAY($1, ',')::BIGINT[])
      AND is_deleted = false
      RETURNING idx
      ;
    `,
    [review_idx_list]
  );

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
