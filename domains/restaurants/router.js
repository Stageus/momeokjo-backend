const router = require("express").Router();
const {
  getRestaurantCategoryList,
  getRestaurantInfoByIdx,
} = require("./controller");

// 음식점 카테고리 리스트 조회
router.get("/categories", getRestaurantCategoryList);

// 음식점 상세보기 조회
router.get("/:restaurant_idx", getRestaurantInfoByIdx);

module.exports = router;
