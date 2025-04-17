const customErrorResponse = require("../../utils/customErrorResponse");
const { tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const rs = require("./service");

// 음식점 리스트 조회
exports.getRestaurantInfoList = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const users_idx = req.accessToken?.users_idx;
  const { category_idx, range, page } = req.query;
  const { user_longitude, user_latitude } = req.body;

  const { total_pages, data } = await rs.getRestaurantInfoListFromDb(
    users_idx,
    category_idx === 0 ? null : category_idx,
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
});

// 음식점 등록
exports.createRestaurantInfo = tryCatchWrapperWithDb(async (req, res, next, client) => {
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

  await rs.createRestaurantInfoAtDb(
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
    client
  );

  res.status(200).json({ message: "요청 처리 성공" });
});

// 음식점 카테고리 리스트 조회
exports.getRestaurantCategoryList = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { include_deleted } = req.query;

  const data = await rs.getRestaurantCategoryListFromDb(include_deleted, client);

  res.status(200).json({ message: "요청 처리 성공", data });
});

// 음식점 카테고리 등록
exports.createRestaurantCategory = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { users_idx, role } = req.accessToken;
  const { category_name } = req.body;

  if (role !== "ADMIN") throw customErrorResponse(403, "권한 없음");

  await rs.createRestaurantCategoryAtDb(users_idx, category_name, client);

  res.status(200).json({ message: "요청 처리 성공" });
});

// 음식점 카테고리 수정
exports.updateRestaurantCategoryByIdx = tryCatchWrapperWithDb(async (req, res, next, client) => {
  if (req.accessToken.role !== "ADMIN") throw customErrorResponse(403, "권한 없음");

  const { category_idx } = req.params;
  const { category_name } = req.body;

  const updated_idx = await rs.updateRestaurantCategoryByIdxAtDb(
    category_idx,
    category_name,
    client
  );
  console.log(updated_idx);
  if (!updated_idx) throw customErrorResponse(404, "수정 대상 없음");

  res.status(200).json({ message: "요청 처리 성공" });
});

// 음식점 랜덤 조회
exports.getRecommendRestaurant = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const users_idx = req.accessToken?.users_idx;
  const { category_idx, range } = req.query;
  const { user_longitude, user_latitude } = req.body;

  const data = await rs.getRecommendRestaurantFromDb(
    users_idx,
    category_idx === 0 ? null : category_idx,
    range,
    user_longitude,
    user_latitude,
    client
  );

  res.status(200).json({ message: "요청 처리 성공", data });
});

// 음식점 메뉴 리스트 조회
exports.getRestaurantMenuInfoList = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const users_idx = req.accessToken?.users_idx;
  const { restaurant_idx } = req.params;
  const { page } = req.query;

  const { total_pages, data } = await rs.getRestaurantMenuInfoListFromDb(
    users_idx,
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
});

// 음식점 메뉴 등록
exports.createRestaurantMenu = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { users_idx } = req.accessToken;
  const { restaurant_idx } = req.params;
  const { menu_name, price } = req.body;

  await rs.createRestaurantMenuAtDb(users_idx, restaurant_idx, menu_name, price, client);

  res.status(200).json({ message: "요청 처리 성공" });
});

// 음식점 메뉴 수정
exports.updateRestaurantMenuByIdx = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { users_idx } = req.accessToken;
  const { menu_idx } = req.params;
  const { menu_name, price } = req.body;

  const return_menu_idx = await rs.updateRestaurantMenuByIdxAtDb(
    users_idx,
    menu_idx,
    menu_name,
    price,
    client
  );
  if (!return_menu_idx) throw customErrorResponse(404, "조회 결과 없음");

  res.status(200).json({ message: "요청 처리 성공" });
});

// 메뉴 후기 리스트 조회
exports.getMenuReviewInfoList = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { users_idx } = req.accessToken;
  const { menu_idx } = req.params;
  const { page } = req.query;

  const { total_pages, data } = await rs.getMenuReviewInfoListFromDb(
    users_idx,
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
});

// 메뉴 후기 등록
exports.createMenuReview = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { users_idx } = req.accessToken;
  const { menu_idx } = req.params;
  const { content } = req.body;
  const image_url = req.file?.location;

  await rs.createMenuReviewAtDb(users_idx, menu_idx, content, image_url, client);

  res.status(200).json({ message: "요청 처리 성공" });
});

// 메뉴 후기 수정
exports.updateMenuReviewByIdx = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { users_idx } = req.accessToken;
  const { review_idx } = req.params;
  const { content } = req.body;
  const image_url = req.file?.location;

  await rs.updateMenuReviewByIdxAtDb(users_idx, review_idx, content, image_url, client);

  res.status(200).json({ message: "요청 처리 성공" });
});

// 음식점 상세보기 조회
exports.getRestaurantInfoByIdx = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const users_idx = req.accessToken?.users_idx;
  const { restaurant_idx } = req.params;

  const data = await rs.getRestaurantInfoByIdxFromDb(users_idx, restaurant_idx, client);
  if (typeof data !== "object" || Object.keys(data).length === 0)
    throw customErrorResponse(404, "조회 결과 없음");

  res.status(200).json({ message: "요청 처리 성공", data });
});

// 음식점 상세보기 수정
exports.updateRestaurantInfoByIdx = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { users_idx } = req.accessToken;
  const { restaurant_idx } = req.params;
  const { category_idx, restaurant_name, address_detail, phone, start_time, end_time } = req.body;

  const return_restaurant_idx = await rs.updateRestaurantInfoByIdxAtDb(
    users_idx,
    restaurant_idx,
    category_idx,
    restaurant_name,
    address_detail,
    phone,
    start_time,
    end_time,
    client
  );
  if (!return_restaurant_idx) throw customErrorResponse(404, "조회 결과 없음");

  res.status(200).json({ message: "요청 처리 성공" });
});
