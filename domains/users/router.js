const router = require("express").Router();
const {
  updateMyInfo,
  getUserInfoByIdx,
  createRestaurantLike,
  deleteRestaurantLike,
  createMenuLike,
  deleteMenuLike,
  createReviewLike,
  deleteReviewLike,
  createRestaurantReport,
} = require("./controller");

// 내 정보 수정
router.put("/", updateMyInfo);

// 사용자 정보 상세정보 조회
router.get("/:user_idx", getUserInfoByIdx);

// 음식점 즐겨찾기 등록
router.post("/:user_idx/likes/restaurants/:restaurant_idx", createRestaurantLike);

// 음식점 즐겨찾기 해제
router.delete("/:user_idx/likes/restaurants/:restaurant_idx", deleteRestaurantLike);

// 메뉴 추천 등록
router.post("/:user_idx/likes/menus/:menu_idx", createMenuLike);

// 메뉴 추천 해제
router.delete("/:user_idx/likes/menus/:menu_idx", deleteMenuLike);

// 후기 좋아요 등록
router.post("/:user_idx/likes/reviews/:review_idx", createReviewLike);

// 후기 좋아요 해제
router.delete("/:user_idx/likes/reviews/:review_idx", deleteReviewLike);

// 음식점 신고 등록
router.post("/:user_idx/reports/restaurants/:restaurant_idx", createRestaurantReport);

module.exports = router;
