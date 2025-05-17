exports.checkIsAdminUserFromDb = async ({ client, id, pw }) => {
  const results = await client.query(
    `
      SELECT
        TRUE AS is_admin_user,
        idx,
        role
      FROM users.lists
      WHERE id = $1
      AND pw = $2
      AND role = 'ADMIN'
      AND is_deleted = false;
    `,
    [id, pw]
  );

  return {
    isAdminUser: results.rows[0]?.is_admin_user ?? false,
    users_idx: results.rows[0]?.idx,
    role: results.rows[0]?.role,
  };
};
