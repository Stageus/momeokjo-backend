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
