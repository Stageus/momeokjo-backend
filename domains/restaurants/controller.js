const { tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const { getRestaurantInfoByIdxFromDb } = require("./service");

// 음식점 상세보기 조회
const getRestaurantInfoByIdx = tryCatchWrapperWithDb(
  async (req, res, next, client) => {
    const { restaurant_idx } = req.params;

    const data = await getRestaurantInfoByIdxFromDb(restaurant_idx, client);

    res.status(200).json({ message: "요청 처리 성공", data });
  }
);

module.exports = { getRestaurantInfoByIdx };
