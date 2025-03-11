const router = require("express").Router();
const { getRestaurantInfoByIdx } = require("./controller");

// 음식점 상세보기 조회
router.get("/:restaurant_idx", getRestaurantInfoByIdx);

module.exports = router;
