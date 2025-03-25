const {
  tryCatchWrapperWithDb,
  tryCatchWrapperWithDbTransaction,
} = require("../../utils/customWrapper");
const {
  updateMyInfoAtDb,
  getUserInfoByIdxFromDb,
  createRestaurantLikeAtDb,
  deleteRestaurantLikeFromDb,
  createMenuLikeAtDb,
  deleteMenuLikeFromDb,
  createReviewLikeAtDb,
  deleteReviewLikeFromDb,
  createRestaurantReportAtDb,
  checkTotalRestaurantReportByIdx,
  deleteRestaurantFromDb,
  deleteMenuFromDb,
  deleteReviewFromDb,
} = require("./service");

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

// 음식점 즐겨찾기 해제
exports.deleteRestaurantLike = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { user_idx, restaurant_idx } = req.params;

  await deleteRestaurantLikeFromDb(user_idx, restaurant_idx, client);

  res.status(200).json({ message: "요청 처리 성공" });
});

// 메뉴 추천 등록
exports.createMenuLike = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { user_idx, menu_idx } = req.params;

  await createMenuLikeAtDb(user_idx, menu_idx, client);

  res.status(200).json({ message: "요청 처리 성공" });
});

// 메뉴 추천 해제
exports.deleteMenuLike = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { user_idx, menu_idx } = req.params;

  await deleteMenuLikeFromDb(user_idx, menu_idx, client);

  res.status(200).json({ message: "요청 처리 성공" });
});

// 후기 좋아요 등록
exports.createReviewLike = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { user_idx, review_idx } = req.params;

  await createReviewLikeAtDb(user_idx, review_idx, client);

  res.status(200).json({ message: "요청 처리 성공" });
});

// 후기 좋아요 해제
exports.deleteReviewLike = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { user_idx, review_idx } = req.params;

  await deleteReviewLikeFromDb(user_idx, review_idx, client);

  res.status(200).json({ message: "요청 처리 성공" });
});

// 음식점 신고 등록
exports.createRestaurantReport = tryCatchWrapperWithDbTransaction(
  async (req, res, next, client) => {
    const { user_idx, restaurant_idx } = req.params;

    await createRestaurantReportAtDb(client, restaurant_idx, user_idx);

    const total_count = await checkTotalRestaurantReportByIdx(client, restaurant_idx);

    if (total_count >= 5) {
      await deleteRestaurantFromDb(client, restaurant_idx);
      await deleteRestaurantLikeFromDb(client, restaurant_idx);

      const menu_idx_list_stringify = await deleteMenuFromDb(client, restaurant_idx);
      await deleteMenuLikeFromDb(client, menu_idx_list_stringify);

      const review_idx_list_stringify = await deleteReviewFromDb(client, menu_idx_list_stringify);
      await deleteReviewLikeFromDb(client, review_idx_list_stringify);
    }

    res.status(200).json({ message: "요청 처리 성공" });
  }
);
