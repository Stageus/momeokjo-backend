const { tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const { updateMyInfoAtDb } = require("./service");

// 내 정보 수정
exports.updateMyInfo = tryCatchWrapperWithDb(async (req, res, next, client) => {
  //TODO: 추후 인증 미들웨어 추가되면 user_idx 수정해야함
  const { user_idx } = { user_idx: 1 };
  const { nickname } = req.body;

  await updateMyInfoAtDb(user_idx, nickname, client);

  res.status(200).json({ message: "요청 처리 성공" });
});
