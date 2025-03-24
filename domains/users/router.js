const router = require("express").Router();
const {
  updateMyInfo,
  getUserInfoByIdx,
  createRestaurantLike,
  deleteRestaurantLike,
} = require("./controller");

// 내 정보 수정
router.put("/", updateMyInfo);

// 사용자 정보 상세정보 조회
router.get("/:user_idx", getUserInfoByIdx);

// 음식점 즐겨찾기 등록
router.post("/:user_idx/likes/restaurants/:restaurant_idx", createRestaurantLike);

// 음식점 즐겨찾기 해제
router.delete("/:user_idx/likes/restaurants/:restaurant_idx", deleteRestaurantLike);

module.exports = router;
