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
exports.deleteRestaurantLikeFromDb = async (user_idx, restaurant_idx, client) => {
  await client.query(
    `
      UPDATE restaurants .likes SET
        is_deleted = true
      WHERE restaurants_idx = $1
      AND users_idx = $2
      AND is_deleted = false;
    `,
    [restaurant_idx, user_idx]
  );
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
