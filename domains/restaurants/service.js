const getRestaurantInfoByIdxFromDB = async (restaurant_idx, client) => {
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

module.exports = { getRestaurantInfoByIdxFromDB };
