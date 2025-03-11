const {
  tryCatchWrapperWithDb,
  tryCatchWrapperWithDbTransaction,
} = require("../../utils/customWrapper");
const {
  getRestaurantCategoryListFromDb,
  createRestaurantCategoryAtDb,
  getRestaurantInfoByIdxFromDb,
} = require("./service");

// 음식점 카테고리 리스트 조회
const getRestaurantCategoryList = tryCatchWrapperWithDb(
  async (req, res, next, client) => {
    const data = await getRestaurantCategoryListFromDb(client);
    res.status(200).json({ message: "요청 처리 성공", data });
  }
);

// 음식점 카테고리 등록
const createRestaurantCategory = tryCatchWrapperWithDbTransaction(
  async (req, res, next, client) => {
    //TODO: 추후 인증 미들웨어 추가되면 user_idx 수정해야함
    const { user_idx } = { user_idx: 1 };
    const { category_name } = req.body;

    await createRestaurantCategoryAtDb(user_idx, category_name, client);

    res.status(200).json({ message: "요청 처리 성공" });
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

module.exports = {
  getRestaurantCategoryList,
  createRestaurantCategory,
  getRestaurantInfoByIdx,
};
