const router = require("express").Router();
const { createValidateChain } = require("../../middlewares/createValidateChain");
const { validateRequest } = require("../../middlewares/validateRequest");
const verifyAccessToken = require("../../middlewares/verifyAccessToken");
const schema = require("./schema");
const uc = require("./controller");
const verifyAccessTokenOptional = require("../../middlewares/verifyAccessTokenOptional");

// 내 정보 수정
router.put(
  "/",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.updateMyInfo),
  validateRequest,
  uc.updateMyInfo
);

// 사용자 정보 상세정보 조회
router.get(
  "/:user_idx",
  verifyAccessTokenOptional("accessToken"),
  createValidateChain(schema.getUserInfoByIdx),
  validateRequest,
  uc.getUserInfoByIdx
);

// 사용자가 즐겨찾기 등록한 음식점 리스트 조회
router.get(
  "/:user_idx/restaurants/likes",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.getRestaurantLikeList),
  validateRequest,
  uc.getRestaurantLikeList
);

// 사용자가 작성한 후기 리스트 조회
router.get(
  "/:user_idx/reviews",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.getReviewList),
  validateRequest,
  uc.getReviewList
);

// 음식점 즐겨찾기 등록
router.post(
  "/likes/restaurants/:restaurant_idx",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.createRestaurantLike),
  validateRequest,
  uc.createRestaurantLike
);

// 음식점 즐겨찾기 해제
router.delete(
  "/likes/restaurants/:restaurant_idx",
  verifyAccessToken("accessToken"),
  createValidateChain(schema.deleteRestaurantLike),
  validateRequest,
  uc.deleteRestaurantLike
);

// 메뉴 추천 등록
router.post(
  "/:user_idx/likes/menus/:menu_idx",
  createValidateChain(schema.createMenuLike),
  validateRequest,
  uc.createMenuLike
);

// 메뉴 추천 해제
router.delete(
  "/:user_idx/likes/menus/:menu_idx",
  createValidateChain(schema.deleteMenuLike),
  validateRequest,
  uc.deleteMenuLike
);

// 후기 좋아요 등록
router.post(
  "/:user_idx/likes/reviews/:review_idx",
  createValidateChain(schema.createReviewLike),
  validateRequest,
  uc.createReviewLike
);

// 후기 좋아요 해제
router.delete(
  "/:user_idx/likes/reviews/:review_idx",
  createValidateChain(schema.deleteReviewLike),
  validateRequest,
  uc.deleteReviewLike
);

// 음식점 신고 등록
router.post(
  "/:user_idx/reports/restaurants/:restaurant_idx",
  createValidateChain(schema.createRestaurantReport),
  validateRequest,
  uc.createRestaurantReport
);

// 메뉴 신고 등록
router.post(
  "/:user_idx/reports/menus/:menu_idx",
  createValidateChain(schema.createMenuReport),
  validateRequest,
  uc.createMenuReport
);

// 후기 신고 등록
router.post(
  "/:user_idx/reports/reviews/:review_idx",
  createValidateChain(schema.createReviewReport),
  validateRequest,
  uc.createReviewReport
);

module.exports = router;
