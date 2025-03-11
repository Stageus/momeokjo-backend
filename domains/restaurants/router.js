const router = require("express").Router();
const {
  createRestaurantInfo,
  getRestaurantCategoryList,
  createRestaurantCategory,
  updateRestaurantCategoryByIdx,
  getRestaurantInfoByIdx,
} = require("./controller");

// 음식점 등록
router.post("/", createRestaurantInfo);

// 음식점 카테고리 리스트 조회
router.get("/categories", getRestaurantCategoryList);

// 음식점 카테고리 등록
router.post("/categories", createRestaurantCategory);

// 음식점 카테고리 수정
router.put("/categories/:category_idx", updateRestaurantCategoryByIdx);

// 음식점 상세보기 조회
router.get("/:restaurant_idx", getRestaurantInfoByIdx);

module.exports = router;
