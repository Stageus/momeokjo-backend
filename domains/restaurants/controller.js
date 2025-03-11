const {
  tryCatchWrapperWithDb,
  tryCatchWrapperWithDbTransaction,
} = require("../../utils/customWrapper");
const {
  createRestaurantInfoAtDb,
  getRestaurantCategoryListFromDb,
  createRestaurantCategoryAtDb,
  updateRestaurantCategoryByIdxAtDb,
  getRestaurantInfoByIdxFromDb,
} = require("./service");

// 음식점 등록
const createRestaurantInfo = tryCatchWrapperWithDbTransaction(
  async (req, res, next, client) => {
    //TODO: 추후 인증 미들웨어 추가되면 user_idx 수정해야함
    const { user_idx } = { user_idx: 1 };
    const {
      category_idx,
      restaurant_name,
      latitude,
      longitude,
      address,
      address_detail,
      phone,
      start_time,
      end_time,
    } = req.body;

    await createRestaurantInfoAtDb(
      category_idx,
      user_idx,
      restaurant_name,
      latitude,
      longitude,
      address,
      address_detail,
      phone,
      start_time,
      end_time,
      client
    );

    res.status(200).json({ message: "요청 처리 성공" });
  }
);

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

// 음식점 카테고리 수정
const updateRestaurantCategoryByIdx = tryCatchWrapperWithDbTransaction(
  async (req, res, next, client) => {
    const { category_idx } = req.params;
    const { category_name } = req.body;

    await updateRestaurantCategoryByIdxAtDb(
      category_idx,
      category_name,
      client
    );

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
  updateRestaurantCategoryByIdx,
  getRestaurantInfoByIdx,
  createRestaurantInfo,
};
