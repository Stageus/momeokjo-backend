const router = require("express").Router();
const { createValidateChain } = require("../../middlewares/createValidateChain");
const { validateRequest } = require("../../middlewares/validateRequest");
const verifyAccessToken = require("../../middlewares/verifyAccessToken");
const schema = require("./schema");
const uc = require("./controller");
const verifyAccessTokenOptional = require("../../middlewares/verifyAccessTokenOptional");
const COOKIE_NAME = require("../../utils/cookieName");

// 내 정보 수정
router.put(
  "/",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.updateMyInfo),
  validateRequest,
  uc.updateMyInfo
);

// 사용자 정보 상세정보 조회
router.get(
  "/:users_idx",
  verifyAccessTokenOptional(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.getUserInfoByIdx),
  validateRequest,
  uc.getUserInfoByIdx
);

// 사용자가 즐겨찾기 등록한 음식점 리스트 조회
router.get(
  "/:users_idx/restaurants/likes",
  verifyAccessTokenOptional(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.getRestaurantLikeList),
  validateRequest,
  uc.getRestaurantLikeList
);

// 사용자가 작성한 후기 리스트 조회
router.get(
  "/:users_idx/reviews",
  verifyAccessTokenOptional(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.getReviewList),
  validateRequest,
  uc.getReviewList
);

// 음식점 즐겨찾기 등록
router.post(
  "/likes/restaurants/:restaurants_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.createRestaurantLike),
  validateRequest,
  uc.createRestaurantLike
);

// 음식점 즐겨찾기 해제
router.delete(
  "/likes/restaurants/:restaurants_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.deleteRestaurantLike),
  validateRequest,
  uc.deleteRestaurantLike
);

// 메뉴 추천 등록
router.post(
  "/likes/menus/:menus_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.createMenuLike),
  validateRequest,
  uc.createMenuLike
);

// 메뉴 추천 해제
router.delete(
  "/likes/menus/:menus_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.deleteMenuLike),
  validateRequest,
  uc.deleteMenuLike
);

// 후기 좋아요 등록
router.post(
  "/likes/reviews/:reviews_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.createReviewLike),
  validateRequest,
  uc.createReviewLike
);

// 후기 좋아요 해제
router.delete(
  "/likes/reviews/:reviews_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.deleteReviewLike),
  validateRequest,
  uc.deleteReviewLike
);

// 음식점 신고 등록
router.post(
  "/reports/restaurants/:restaurants_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.createRestaurantReport),
  validateRequest,
  uc.createRestaurantReport
);

// 메뉴 신고 등록
router.post(
  "/reports/menus/:menus_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.createMenuReport),
  validateRequest,
  uc.createMenuReport
);

// 후기 신고 등록
router.post(
  "/reports/reviews/:reviews_idx",
  verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN),
  createValidateChain(schema.createReviewReport),
  validateRequest,
  uc.createReviewReport
);

module.exports = router;
