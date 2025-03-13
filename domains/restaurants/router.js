const router = require("express").Router();
const {
  getRestaurantInfoList,
  createRestaurantInfo,
  getRestaurantCategoryList,
  createRestaurantCategory,
  updateRestaurantCategoryByIdx,
  getRecommendRestaurant,
  getRestaurantInfoByIdx,
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

// 음식점 상세보기 조회
router.get("/:restaurant_idx", getRestaurantInfoByIdx);

module.exports = router;
