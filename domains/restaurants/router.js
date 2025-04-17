const router = require("express").Router();
const upload = require("../../config/aws-s3");
const { createValidateChain } = require("../../middlewares/createValidateChain");
const { validateRequest } = require("../../middlewares/validateRequest");
const rc = require("./controller");
const schema = require("./schema");
const verifyAccessToken = require("../../middlewares/verifyAccessToken");
const verifyAccessTokenOptional = require("../../middlewares/verifyAccessTokenOptional");

// 음식점 리스트 조회
router.get(
  "/",
  verifyAccessTokenOptional("accessToken"),
  createValidateChain(schema.getRestaurantInfoList),
  validateRequest,
  rc.getRestaurantInfoList
);

// 음식점 등록
router.post(
  "/",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.createRestaurantInfo),
  validateRequest,
  rc.createRestaurantInfo
);

// 음식점 카테고리 리스트 조회
router.get(
  "/categories",
  createValidateChain(schema.getRestaurantCategoryList),
  validateRequest,
  rc.getRestaurantCategoryList
);

// 음식점 카테고리 등록
router.post(
  "/categories",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.createRestaurantCategory),
  validateRequest,
  rc.createRestaurantCategory
);

// 음식점 카테고리 수정
router.put(
  "/categories/:category_idx",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.updateRestaurantCategoryByIdx),
  validateRequest,
  rc.updateRestaurantCategoryByIdx
);

// 음식점 랜덤 조회
router.get(
  "/recommends",
  verifyAccessTokenOptional("accessToken"),
  createValidateChain(schema.getRecommendRestaurant),
  validateRequest,
  rc.getRecommendRestaurant
);

// 메뉴 후기 리스트 조회
router.get(
  "/menus/:menu_idx/reviews",
  verifyAccessTokenOptional("accessToken"),
  createValidateChain(schema.getMenuReviewInfoList),
  validateRequest,
  rc.getMenuReviewInfoList
);

// 메뉴 후기 등록
router.post(
  "/menus/:menu_idx/reviews",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.createMenuReview),
  validateRequest,
  upload.single("image"),
  rc.createMenuReview
);

// 메뉴 후기 수정
router.put(
  "/menus/reviews/:review_idx",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.updateMenuReviewByIdx),
  validateRequest,
  upload.single("image"),
  rc.updateMenuReviewByIdx
);

// 음식점 메뉴 리스트 조회
router.get(
  "/:restaurant_idx/menus",
  verifyAccessTokenOptional("accessToken"),
  createValidateChain(schema.getRestaurantMenuInfoList),
  validateRequest,
  rc.getRestaurantMenuInfoList
);

// 음식점 메뉴 등록
router.post(
  "/:restaurant_idx/menus",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.createRestaurantMenu),
  validateRequest,
  rc.createRestaurantMenu
);

// 음식점 메뉴 수정
router.put(
  "/menus/:menu_idx",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.updateRestaurantMenuByIdx),
  validateRequest,
  rc.updateRestaurantMenuByIdx
);

// 음식점 상세보기 조회
router.get(
  "/:restaurant_idx",
  verifyAccessTokenOptional("accessToken"),
  createValidateChain(schema.getRestaurantInfoByIdx),
  validateRequest,
  rc.getRestaurantInfoByIdx
);

// 음식점 상세보기 수정
router.put(
  "/:restaurant_idx",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.updateRestaurantInfoByIdx),
  validateRequest,
  rc.updateRestaurantInfoByIdx
);

module.exports = router;
