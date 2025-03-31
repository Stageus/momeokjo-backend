const router = require("express").Router();
const uc = require("./controller");

// 내 정보 수정
router.put("/", uc.updateMyInfo);

// 사용자 정보 상세정보 조회
router.get("/:user_idx", uc.getUserInfoByIdx);

// 사용자가 즐겨찾기 등록한 음식점 리스트 조회
router.get("/:user_idx/restaurants/likes", uc.getRestaurantLikeList);

// 사용자가 작성한 후기 리스트 조회
router.get("/:user_idx/reviews", uc.getReviewList);

// 음식점 즐겨찾기 등록
router.post("/:user_idx/likes/restaurants/:restaurant_idx", uc.createRestaurantLike);

// 음식점 즐겨찾기 해제
router.delete("/:user_idx/likes/restaurants/:restaurant_idx", uc.deleteRestaurantLike);

// 메뉴 추천 등록
router.post("/:user_idx/likes/menus/:menu_idx", uc.createMenuLike);

// 메뉴 추천 해제
router.delete("/:user_idx/likes/menus/:menu_idx", uc.deleteMenuLike);

// 후기 좋아요 등록
router.post("/:user_idx/likes/reviews/:review_idx", uc.createReviewLike);

// 후기 좋아요 해제
router.delete("/:user_idx/likes/reviews/:review_idx", uc.deleteReviewLike);

// 음식점 신고 등록
router.post("/:user_idx/reports/restaurants/:restaurant_idx", uc.createRestaurantReport);

// 메뉴 신고 등록
router.post("/:user_idx/reports/menus/:menu_idx", uc.createMenuReport);

// 후기 신고 등록
router.post("/:user_idx/reports/reviews/:review_idx", uc.createReviewReport);

module.exports = router;
