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

  console.log(results);

  return results.rows[0];
};
