const { tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const { updateMyInfoAtDb, getUserInfoByIdxFromDb, createRestaurantLikeAtDb } = require("./service");

// 내 정보 수정
exports.updateMyInfo = tryCatchWrapperWithDb(async (req, res, next, client) => {
  //TODO: 추후 인증 미들웨어 추가되면 user_idx 수정해야함
  const { user_idx } = { user_idx: 1 };
  const { nickname } = req.body;

  await updateMyInfoAtDb(user_idx, nickname, client);

  res.status(200).json({ message: "요청 처리 성공" });
});

// 사용자 정보 상세정보 조회
exports.getUserInfoByIdx = tryCatchWrapperWithDb(async (req, res, next, client) => {
  //TODO: 추후 인증 미들웨어 추가되면 user_idx 수정해야함
  const { user_idx: user_idx_from_cookie } = { user_idx: 1 };
  const { user_idx } = req.params;

  const data = await getUserInfoByIdxFromDb(user_idx_from_cookie, user_idx, client);

  res.status(200).json({ message: "요청 처리 성공", data });
});

// 음식점 즐겨찾기 등록
exports.createRestaurantLike = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { user_idx, restaurant_idx } = req.params;

  await createRestaurantLikeAtDb(user_idx, restaurant_idx, client);

  res.status(200).json({ message: "요청 처리 성공" });
});
