const customErrorResponse = require("../../utils/customErrorResponse");
const {
  tryCatchWrapperWithDb,
  tryCatchWrapperWithDbTransaction,
} = require("../../utils/customWrapper");
const us = require("./service");
const COOKIE_NAME = require("../../utils/cookieName");
const { getPool } = require("../../database/db");

// 내 정보 수정
exports.updateMyInfo = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
  const { nickname } = req.body;

  const isUpdated = await us.updateMyInfoAtDb({ users_idx, nickname, client });
  if (!isUpdated) throw customErrorResponse({ status: 404, message: "사용자 정보 수정 대상 없음" });

  res.status(200).json({ message: "요청 처리 성공" });
});

// 사용자 정보 상세정보 조회
exports.getUserInfoByIdx = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const users_idx_from_cookie = req[COOKIE_NAME.ACCESS_TOKEN]?.users_idx;
  const { users_idx } = req.params;

  const data = await us.getUserInfoByIdxFromDb({ users_idx_from_cookie, users_idx, client });
  if (typeof data !== "object" || Object.keys(data).length === 0)
    throw customErrorResponse({ status: 404, message: "일치하는 사용자 없음" });

  res.status(200).json({ message: "요청 처리 성공", data });
});

// 사용자가 즐겨찾기 등록한 음식점 리스트 조회
exports.getRestaurantLikeList = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const users_idx_from_cookie = req[COOKIE_NAME.ACCESS_TOKEN]?.users_idx;
  const { users_idx } = req.params;
  const { page } = req.query;

  const { data, total_pages } = await us.getRestaurantLikeListFromDb({
    client,
    users_idx_from_cookie,
    users_idx,
    page,
  });

  res
    .status(200)
    .json({ message: "요청 처리 성공", total_pages, current_page: parseInt(page), data });
});

// 사용자가 작성한 후기 리스트 조회
exports.getReviewList = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const users_idx_from_cookie = req[COOKIE_NAME.ACCESS_TOKEN]?.users_idx;
  const { users_idx } = req.params;
  const { page } = req.query;

  const { data, total_pages } = await us.getReviewListFromDb({
    client,
    users_idx_from_cookie,
    users_idx,
    page,
  });

  res
    .status(200)
    .json({ message: "요청 처리 성공", total_pages, current_page: parseInt(page), data });
});

// 음식점 즐겨찾기 등록
exports.createRestaurantLike = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
  const { restaurants_idx } = req.params;

  await us.createRestaurantLikeAtDb({ users_idx, restaurants_idx, client });

  res.status(200).json({ message: "요청 처리 성공" });
});

// 음식점 즐겨찾기 해제
exports.deleteRestaurantLike = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
  const { restaurants_idx } = req.params;

  const isUpdated = await us.deleteRestaurantLikeFromDb({ client, restaurants_idx, users_idx });
  if (!isUpdated)
    throw customErrorResponse({ status: 404, message: "음식점 즐겨찾기 등록 내역 없음" });

  res.status(200).json({ message: "요청 처리 성공" });
});

// 메뉴 추천 등록
exports.createMenuLike = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
  const { menus_idx } = req.params;

  await us.createMenuLikeAtDb({ users_idx, menus_idx, client });

  res.status(200).json({ message: "요청 처리 성공" });
});

// 메뉴 추천 해제
exports.deleteMenuLike = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
  const { menus_idx } = req.params;

  const isUpdated = await us.deleteMenuLikeFromDb({ client, users_idx, menus_idx });
  if (!isUpdated) throw customErrorResponse({ status: 404, message: "메뉴 추천 등록 내역 없음" });

  res.status(200).json({ message: "요청 처리 성공" });
});

// 후기 좋아요 등록
exports.createReviewLike = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
  const { reviews_idx } = req.params;

  await us.createReviewLikeAtDb({ users_idx, reviews_idx, client });

  res.status(200).json({ message: "요청 처리 성공" });
});

// 후기 좋아요 해제
exports.deleteReviewLike = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
  const { reviews_idx } = req.params;

  const isUpdated = await us.deleteReviewLikeFromDb({ client, reviews_idx, users_idx });
  if (!isUpdated) throw customErrorResponse({ status: 404, message: "후기 좋아요 등록 내역 없음" });

  res.status(200).json({ message: "요청 처리 성공" });
});

// 음식점 신고 등록
exports.createRestaurantReport = tryCatchWrapperWithDbTransaction(getPool())(
  async (req, res, next, client) => {
    const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
    const { restaurants_idx } = req.params;

    await us.createRestaurantReportAtDb({ client, restaurants_idx, users_idx });

    const total_count = await us.getTotalRestaurantReportByIdx({ client, restaurants_idx });

    if (total_count >= 5) {
      await us.deleteRestaurantFromDb({ client, restaurants_idx });
      await us.deleteRestaurantLikeFromDb({ client, restaurants_idx });

      const menus_idx_list = await us.deleteMenuFromDbByRestaurantsIdx({ client, restaurants_idx });
      await us.deleteMenuLikeFromDbWithArray({ client, menus_idx_list });

      const reviews_idx_list = await us.deleteReviewFromDbByRestaurantsIdx({
        client,
        restaurants_idx,
      });
      await us.deleteReviewLikeFromDbWithArray({ client, reviews_idx_list });
    }

    res.status(200).json({ message: "요청 처리 성공" });
  }
);

// 메뉴 신고 등록
exports.createMenuReport = tryCatchWrapperWithDbTransaction(getPool())(
  async (req, res, next, client) => {
    const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
    const { menus_idx } = req.params;

    await us.createMenuReportAtDb({ client, menus_idx, users_idx });

    const total_count = await us.checkTotalMenuReportByIdx({ client, menus_idx });

    if (total_count >= 5) {
      const menus_idx_list = await us.deleteMenuFromDbByMenusIdx({ client, menus_idx });
      await us.deleteMenuLikeFromDbWithArray({ client, menus_idx_list });

      const reviews_idx_list = await us.deleteReviewFromDbByMenusIdx({
        client,
        menus_idx,
      });
      await us.deleteReviewLikeFromDbWithArray({ client, reviews_idx_list });
    }

    res.status(200).json({ message: "요청 처리 성공" });
  }
);

// 후기 신고 등록
exports.createReviewReport = tryCatchWrapperWithDbTransaction(getPool())(
  async (req, res, next, client) => {
    const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];
    const { reviews_idx } = req.params;

    await us.createReviewReportAtDb({ client, reviews_idx, users_idx });

    const total_count = await us.checkTotalReviewReportByIdx({ client, reviews_idx });

    if (total_count >= 5) {
      const reviews_idx_list = await us.deleteReviewFromDbByReviewsIdx({
        client,
        reviews_idx,
      });
      await us.deleteReviewLikeFromDbWithArray({ client, reviews_idx_list });
    }

    res.status(200).json({ message: "요청 처리 성공" });
  }
);
