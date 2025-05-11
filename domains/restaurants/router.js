const router = require("express").Router();
const upload = require("../../config/aws-s3");
const { createValidateChain } = require("../../middlewares/createValidateChain");
const { validateRequest } = require("../../middlewares/validateRequest");
const rc = require("./controller");
const schema = require("./schema");
const verifyAccessToken = require("../../middlewares/verifyAccessToken");
const verifyAccessTokenOptional = require("../../middlewares/verifyAccessTokenOptional");
const COOKIE_NAME = require("../../utils/cookieName");

// 음식점 리스트 조회
router.get(
  "/",
  verifyAccessTokenOptional(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.getRestaurantInfoList),
  validateRequest,
  rc.getRestaurantInfoList
);

// 음식점 등록
router.post(
  "/",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
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
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.createRestaurantCategory),
  validateRequest,
  rc.createRestaurantCategory
);

// 음식점 카테고리 수정
router.put(
  "/categories/:category_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.updateRestaurantCategoryByIdx),
  validateRequest,
  rc.updateRestaurantCategoryByIdx
);

// 음식점 랜덤 조회
router.get(
  "/recommends",
  verifyAccessTokenOptional(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.getRecommendRestaurant),
  validateRequest,
  rc.getRecommendRestaurant
);

// 메뉴 후기 리스트 조회
router.get(
  "/menus/:menus_idx/reviews",
  verifyAccessTokenOptional(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.getMenuReviewInfoList),
  validateRequest,
  rc.getMenuReviewInfoList
);

// 메뉴 후기 등록
router.post(
  "/:restaurants_idx/menus/:menus_idx/reviews",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  upload.single("image"),
  createValidateChain(schema.createMenuReview),
  validateRequest,
  rc.createMenuReview
);

// 메뉴 후기 수정
router.put(
  "/menus/reviews/:reviews_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  upload.single("image"),
  createValidateChain(schema.updateMenuReviewByIdx),
  validateRequest,
  rc.updateMenuReviewByIdx
);

// 음식점 메뉴 리스트 조회
router.get(
  "/:restaurants_idx/menus",
  verifyAccessTokenOptional(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.getRestaurantMenuInfoList),
  validateRequest,
  rc.getRestaurantMenuInfoList
);

// 음식점 메뉴 등록
router.post(
  "/:restaurants_idx/menus",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.createRestaurantMenu),
  validateRequest,
  rc.createRestaurantMenu
);

// 음식점 메뉴 수정
router.put(
  "/menus/:menus_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.updateRestaurantMenuByIdx),
  validateRequest,
  rc.updateRestaurantMenuByIdx
);

// 음식점 상세보기 조회
router.get(
  "/:restaurants_idx",
  verifyAccessTokenOptional(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.getRestaurantInfoByIdx),
  validateRequest,
  rc.getRestaurantInfoByIdx
);

// 음식점 상세보기 수정
router.put(
  "/:restaurants_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.updateRestaurantInfoByIdx),
  validateRequest,
  rc.updateRestaurantInfoByIdx
);

module.exports = router;
