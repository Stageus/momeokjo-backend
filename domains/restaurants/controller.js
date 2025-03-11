const { tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const {
  getRestaurantCategoryListFromDb,
  getRestaurantInfoByIdxFromDb,
} = require("./service");

// 음식점 카테고리 리스트 조회
const getRestaurantCategoryList = tryCatchWrapperWithDb(
  async (req, res, next, client) => {
    const data = await getRestaurantCategoryListFromDb(client);
    res.status(200).json({ message: "요청 처리 성공", data });
  }
);

// 음식점 상세보기 조회
const getRestaurantInfoByIdx = tryCatchWrapperWithDb(
  async (req, res, next, client) => {
    const { restaurant_idx } = req.params;

    const data = await getRestaurantInfoByIdxFromDb(restaurant_idx, client);

    res.status(200).json({ message: "요청 처리 성공", data });
  }
);

module.exports = { getRestaurantCategoryList, getRestaurantInfoByIdx };
