// 음식점 카테고리 리스트 조회
const getRestaurantCategoryListFromDb = async (client) => {
  const results = await client.query(
    `
      SELECT
        idx AS category_idx,
        name AS category_name
      FROM restaurants.categories
      WHERE is_deleted = false;
    `
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

// 음식점 상세보기 조회
const getRestaurantInfoByIdxFromDb = async (restaurant_idx, client) => {
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

module.exports = {
  getRestaurantCategoryListFromDb,
  createRestaurantCategoryAtDb,
  updateRestaurantCategoryByIdxAtDb,
  getRestaurantInfoByIdxFromDb,
};
