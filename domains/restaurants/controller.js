const { tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const { getRestaurantInfoByIdxFromDB } = require("./service");

const getRestaurantInfo = tryCatchWrapperWithDb(
  async (req, res, next, client) => {
    const { restaurant_idx } = req.params;

    const data =
      (await getRestaurantInfoByIdxFromDB(restaurant_idx, client)) ?? {};

    res.status(200).json({ message: "요청 처리 성공", data });
  }
);

module.exports = { getRestaurantInfo };
