const as = require("./service");
const { tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const customErrorResponse = require("../../utils/customErrorResponse");
const jwt = require("../../utils/jwt");
const { accessTokenOptions, refreshTokenOptions } = require("../../config/cookies");
const COOKIE_NAME = require("../../utils/cookieName");
const { getPool } = require("../../database/db");

// 로그인
exports.signIn = tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
  const { id, pw } = req.body;

  const { isAdminUser, users_idx, role } = await as.checkIsAdminUserFromDb({ client, id, pw });
  if (!isAdminUser) throw customErrorResponse({ status: 404, message: "등록된 계정 없음" });

  const { isCreated: isRefreshCreated, results: refreshResults } = jwt.createRefreshToken({
    payload: { users_idx, role },
  });
  if (!isRefreshCreated) throw customErrorResponse({ status: 500, message: refreshResults });

  const { isCreated: isAccessCreated, results: accessResults } = jwt.createAccessToken({
    payload: { users_idx, provider: "LOCAL", role },
  });
  if (!isAccessCreated) throw customErrorResponse({ status: 500, message: accessResults });

  res.cookie(COOKIE_NAME.REFRESH_TOKEN, refreshResults, refreshTokenOptions);
  res.cookie(COOKIE_NAME.ACCESS_TOKEN, accessResults, accessTokenOptions);
  res.status(200).json({ message: "요청 처리 성공" });
});
