const customErrorResponse = require("../../utils/customErrorResponse");
const { tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const rs = require("./service");
const COOKIE_NAME = require("../../utils/cookieName");
const { getPool } = require("../../database/db");

// 음식점 리스트 조회
exports.getRestaurantInfoList = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const users_idx = req[COOKIE_NAME.ACCESS_TOKEN]?.users_idx;
  const { category_idx, range, page, longitude, latitude } = req.query;

  const { total_pages, data } = await rs.getRestaurantInfoListFromDb({
    users_idx,
    category_idx: category_idx === 0 ? null : category_idx,
    range,
    page,
    longitude,
    latitude,
    client,
  });

  res.status(200).json({
    message: "요청 처리 성공",
    total_pages,
    current_page: parseInt(page),
    data,
  });
});

// 음식점 등록
exports.createRestaurantInfo = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const { users_idx } = req.accessToken;
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

  await rs.createRestaurantInfoAtDb({
    category_idx,
    users_idx,
    restaurant_name,
    latitude,
    longitude,
    address,
    address_detail,
    phone,
    start_time,
    end_time,
    client,
  });

  res.status(200).json({ message: "요청 처리 성공" });
});

// 음식점 카테고리 리스트 조회
exports.getRestaurantCategoryList = tryCatchWrapperWithDb(getPool())(
  async (req, res, next, client) => {
    const { include_deleted } = req.query;

    const data = await rs.getRestaurantCategoryListFromDb({ include_deleted, client });

    res.status(200).json({ message: "요청 처리 성공", data });
  }
);

// 음식점 카테고리 등록
exports.createRestaurantCategory = tryCatchWrapperWithDb(getPool())(
  async (req, res, next, client) => {
    const { users_idx, role } = req[COOKIE_NAME.ACCESS_TOKEN];
    const { category_name } = req.body;

    if (role !== "ADMIN") throw customErrorResponse({ status: 403, message: "권한 없음" });

    await rs.createRestaurantCategoryAtDb({ users_idx, category_name, client });

    res.status(200).json({ message: "요청 처리 성공" });
  }
);

// 음식점 카테고리 수정
exports.updateRestaurantCategoryByIdx = tryCatchWrapperWithDb(getPool())(
  async (req, res, next, client) => {
    if (req.accessToken.role !== "ADMIN")
      throw customErrorResponse({ status: 403, message: "권한 없음" });

    const { category_idx } = req.params;
    const { category_name } = req.body;

    const updated_idx = await rs.updateRestaurantCategoryByIdxAtDb({
      category_idx,
      category_name,
      client,
    });

    if (!updated_idx)
      throw customErrorResponse({ status: 404, message: "카테고리 수정 대상 없음" });

    res.status(200).json({ message: "요청 처리 성공" });
  }
);

// 음식점 랜덤 조회
exports.getRecommendRestaurant = tryCatchWrapperWithDb(getPool())(
  async (req, res, next, client) => {
    const users_idx = req[COOKIE_NAME.ACCESS_TOKEN]?.users_idx;
    const { category_idx, range, longitude, latitude } = req.query;

    const data = await rs.getRecommendRestaurantFromDb({
      users_idx,
      category_idx: category_idx === 0 ? null : category_idx,
      range,
      longitude,
      latitude,
      client,
    });
    if (Object.keys(data).length === 0)
      throw customErrorResponse({ status: 404, message: "추천 음식점 없음" });

    res.status(200).json({ message: "요청 처리 성공", data });
  }
);

// 음식점 메뉴 리스트 조회
exports.getRestaurantMenuInfoList = tryCatchWrapperWithDb(getPool())(
  async (req, res, next, client) => {
    const users_idx = req[COOKIE_NAME.ACCESS_TOKEN]?.users_idx;
    const { restaurants_idx } = req.params;
    const { page } = req.query;

    const { total_pages, data } = await rs.getRestaurantMenuInfoListFromDb({
      users_idx,
      restaurants_idx,
      page,
      client,
    });

    res.status(200).json({
      message: "요청 처리 성공",
      total_pages,
      current_page: parseInt(page),
      data,
    });
  }
);

// 음식점 메뉴 등록
exports.createRestaurantMenu = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
  const { restaurants_idx } = req.params;
  const { menu_name, price } = req.body;

  await rs.createRestaurantMenuAtDb({
    users_idx,
    restaurants_idx,
    menu_name,
    price,
    client,
  });

  res.status(200).json({ message: "요청 처리 성공" });
});

// 음식점 메뉴 수정
exports.updateRestaurantMenuByIdx = tryCatchWrapperWithDb(getPool())(
  async (req, res, next, client) => {
    const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
    const { menus_idx } = req.params;
    const { menu_name, price } = req.body;

    const isUpdated = await rs.updateRestaurantMenuByIdxAtDb({
      users_idx,
      menus_idx,
      menu_name,
      price,
      client,
    });
    if (!isUpdated) throw customErrorResponse({ status: 404, message: "메뉴 수정 대상 없음" });

    res.status(200).json({ message: "요청 처리 성공" });
  }
);

// 메뉴 후기 리스트 조회
exports.getMenuReviewInfoList = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const users_idx = req[COOKIE_NAME.ACCESS_TOKEN]?.users_idx;
  const { menus_idx } = req.params;
  const { page } = req.query;

  const { total_pages, data } = await rs.getMenuReviewInfoListFromDb({
    users_idx,
    menus_idx,
    page,
    client,
  });

  res.status(200).json({
    message: "요청 처리 성공",
    total_pages,
    current_page: parseInt(page),
    data,
  });
});

// 메뉴 후기 등록
exports.createMenuReview = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
  const { restaurants_idx, menus_idx } = req.params;
  const { content } = req.body;
  const image_url = req.file?.location;

  await rs.createMenuReviewAtDb({
    users_idx,
    menus_idx,
    content,
    image_url,
    restaurants_idx,
    client,
  });

  res.status(200).json({ message: "요청 처리 성공" });
});

// 메뉴 후기 수정
exports.updateMenuReviewByIdx = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const { users_idx } = req.accessToken;
  const { reviews_idx } = req.params;
  const { content } = req.body;
  const image_url = req.file?.location;

  const isUpdated = await rs.updateMenuReviewByIdxAtDb({
    users_idx,
    reviews_idx,
    content,
    image_url,
    client,
  });
  if (!isUpdated) throw customErrorResponse({ status: 404, message: "후기 수정 대상 없음" });

  res.status(200).json({ message: "요청 처리 성공" });
});

// 음식점 상세보기 조회
exports.getRestaurantInfoByIdx = tryCatchWrapperWithDb(getPool())(
  async (req, res, next, client) => {
    const users_idx = req[COOKIE_NAME.ACCESS_TOKEN]?.users_idx;
    const { restaurants_idx } = req.params;

    const data = await rs.getRestaurantInfoByIdxFromDb({ users_idx, restaurants_idx, client });
    if (typeof data !== "object" || Object.keys(data).length === 0)
      throw customErrorResponse({ status: 404, message: "음식점 정보 없음" });

    res.status(200).json({ message: "요청 처리 성공", data });
  }
);

// 음식점 상세보기 수정
exports.updateRestaurantInfoByIdx = tryCatchWrapperWithDb(getPool())(
  async (req, res, next, client) => {
    const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
    const { restaurants_idx } = req.params;
    const { category_idx, restaurant_name, address_detail, phone, start_time, end_time } = req.body;

    const isUpdated = await rs.updateRestaurantInfoByIdxAtDb({
      users_idx,
      restaurants_idx,
      category_idx,
      restaurant_name,
      address_detail,
      phone,
      start_time,
      end_time,
      client,
    });
    if (!isUpdated) throw customErrorResponse({ status: 404, message: "음식점 정보 없음" });

    res.status(200).json({ message: "요청 처리 성공" });
  }
);
