const router = require("express").Router();
const { updateMyInfo, getUserInfoByIdx } = require("./controller");

// 내 정보 수정
router.put("/", updateMyInfo);

// 사용자 정보 상세정보 조회
router.get("/:user_idx", getUserInfoByIdx);

module.exports = router;
