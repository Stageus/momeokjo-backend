const router = require("express").Router();
const {
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
} = require("./controller");

// 음식점 리스트 조회
router.get("/", getRestaurantInfoList);

// 음식점 등록
router.post("/", createRestaurantInfo);

// 음식점 카테고리 리스트 조회
router.get("/categories", getRestaurantCategoryList);

// 음식점 카테고리 등록
router.post("/categories", createRestaurantCategory);

// 음식점 카테고리 수정
router.put("/categories/:category_idx", updateRestaurantCategoryByIdx);

// 음식점 랜덤 조회
router.get("/recommends", getRecommendRestaurant);

// 메뉴 후기 리스트 조회
router.get("/menus/:menu_idx/reviews", getMenuReviewInfoList);

// 메뉴 후기 등록
router.post("/menus/:menu_idx/reviews", createMenuReview);

// 메뉴 후기 수정
router.put("/menus/reviews/:review_idx", updateMenuReviewByIdx);

// 음식점 메뉴 리스트 조회
router.get("/:restaurant_idx/menus", getRestaurantMenuInfoList);

// 음식점 메뉴 등록
router.post("/:restaurant_idx/menus", createRestaurantMenu);

// 음식점 메뉴 수정
router.put("/menus/:menu_idx", updateRestaurantMenuByIdx);

// 음식점 상세보기 조회
router.get("/:restaurant_idx", getRestaurantInfoByIdx);

// 음식점 상세보기 수정
router.put("/:restaurant_idx", updateRestaurantInfoByIdx);

module.exports = router;
