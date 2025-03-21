const router = require("express").Router();
const { updateMyInfo } = require("./controller");

// 내 정보 수정
router.put("/", updateMyInfo);

module.exports = router;
