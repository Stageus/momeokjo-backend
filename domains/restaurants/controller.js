const {
  tryCatchWrapperWithDb,
  tryCatchWrapperWithDbTransaction,
} = require("../../utils/customWrapper");
const {
  getRestaurantInfoListFromDb,
  createRestaurantInfoAtDb,
  getRestaurantCategoryListFromDb,
  createRestaurantCategoryAtDb,
  updateRestaurantCategoryByIdxAtDb,
  getRecommendRestaurantFromDb,
  getRestaurantMenuInfoListFromDb,
  createRestaurantMenuAtDb,
  updateRestaurantMenuByIdxAtDb,
  getMenuReviewInfoListFromDb,
  createMenuReviewAtDb,
  updateMenuReviewByIdxAtDb,
  getRestaurantInfoByIdxFromDb,
  updateRestaurantInfoByIdxAtDb,
} = require("./service");

// 음식점 리스트 조회
const getRestaurantInfoList = tryCatchWrapperWithDb(
  async (req, res, next, client) => {
    //TODO: 추후 인증 미들웨어 추가되면 user_idx 수정해야함
    const { user_idx } = { user_idx: 1 };
    const { category_idx, range, page } = req.query;
    const { user_longitude, user_latitude } = req.body;

    const { total_pages, data } = await getRestaurantInfoListFromDb(
      user_idx,
      category_idx,
      range,
      page,
      user_longitude,
      user_latitude,
      client
    );

    res.status(200).json({
      message: "요청 처리 성공",
      total_pages,
      current_page: parseInt(page),
      data,
    });
  }
);

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
    const { include_deleted } = req.query;

    const data = await getRestaurantCategoryListFromDb(include_deleted, client);

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

// 음식점 랜덤 조회
const getRecommendRestaurant = tryCatchWrapperWithDb(
  async (req, res, next, client) => {
    const { user_idx } = { user_idx: 1 };
    const { category_idx, range } = req.query;
    const { user_longitude, user_latitude } = req.body;

    const data = await getRecommendRestaurantFromDb(
      user_idx,
      category_idx,
      range,
      user_longitude,
      user_latitude,
      client
    );

    res.status(200).json({ message: "요청 처리 성공", data });
  }
);

// 음식점 메뉴 리스트 조회
const getRestaurantMenuInfoList = tryCatchWrapperWithDb(
  async (req, res, next, client) => {
    const { restaurant_idx } = req.params;
    const { page } = req.query;

    const { total_pages, data } = await getRestaurantMenuInfoListFromDb(
      restaurant_idx,
      page,
      client
    );
    console.log(data);
    res.status(200).json({
      message: "요청 처리 성공",
      total_pages,
      current_page: parseInt(page),
      data,
    });
  }
);

// 음식점 메뉴 등록
const createRestaurantMenu = tryCatchWrapperWithDbTransaction(
  async (req, res, next, client) => {
    //TODO: 추후 인증 미들웨어 추가되면 user_idx 수정해야함
    const { user_idx } = { user_idx: 1 };
    const { restaurant_idx } = req.params;
    const { menu_name, price } = req.body;

    await createRestaurantMenuAtDb(
      user_idx,
      restaurant_idx,
      menu_name,
      price,
      client
    );

    res.status(200).json({ message: "요청 처리 성공" });
  }
);

// 음식점 메뉴 수정
const updateRestaurantMenuByIdx = tryCatchWrapperWithDb(
  async (req, res, next, client) => {
    const { menu_idx } = req.params;
    const { menu_name, price } = req.body;

    await updateRestaurantMenuByIdxAtDb(menu_idx, menu_name, price, client);

    res.status(200).json({ message: "요청 처리 성공" });
  }
);

// 메뉴 후기 리스트 조회
const getMenuReviewInfoList = tryCatchWrapperWithDb(
  async (req, res, next, client) => {
    const { menu_idx } = req.params;
    const { page } = req.query;

    const { total_pages, data } = await getMenuReviewInfoListFromDb(
      menu_idx,
      page,
      client
    );

    res.status(200).json({
      message: "요청 처리 성공",
      total_pages,
      current_page: parseInt(page),
      data,
    });
  }
);

// 메뉴 후기 등록
const createMenuReview = tryCatchWrapperWithDbTransaction(
  async (req, res, next, client) => {
    //TODO: 추후 인증 미들웨어 추가되면 user_idx 수정해야함
    const { user_idx } = { user_idx: 1 };
    const { menu_idx } = req.params;
    //TODO:이미지 등록 기능 추가해야함.
    const { content } = req.body;

    await createMenuReviewAtDb(user_idx, menu_idx, content, client);

    res.status(200).json({ message: "요청 처리 성공" });
  }
);

// 메뉴 후기 수정
const updateMenuReviewByIdx = tryCatchWrapperWithDb(
  async (req, res, next, client) => {
    const { review_idx } = req.params;
    const { content } = req.body;

    await updateMenuReviewByIdxAtDb(review_idx, content, client);

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

// 음식점 상세보기 수정
const updateRestaurantInfoByIdx = tryCatchWrapperWithDbTransaction(
  async (req, res, next, client) => {
    const { restaurant_idx } = req.params;
    const {
      category_idx,
      restaurant_name,
      address_detail,
      phone,
      start_time,
      end_time,
    } = req.body;

    await updateRestaurantInfoByIdxAtDb(
      restaurant_idx,
      category_idx,
      restaurant_name,
      address_detail,
      phone,
      start_time,
      end_time,
      client
    );

    res.status(200).json({ message: "요청 처리 성공" });
  }
);

module.exports = {
  getRestaurantInfoList,
  createRestaurantInfo,
  getRestaurantCategoryList,
  createRestaurantCategory,
  updateRestaurantCategoryByIdx,
  getRecommendRestaurant,
  getRestaurantMenuInfoList,
  createRestaurantMenu,
  updateRestaurantMenuByIdx,
  getMenuReviewInfoList,
  createMenuReview,
  updateMenuReviewByIdx,
  getRestaurantInfoByIdx,
  updateRestaurantInfoByIdx,
};
