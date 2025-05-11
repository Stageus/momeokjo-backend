const customErrorResponse = require("../utils/customErrorResponse");
const { tryCatchWrapperWithDb } = require("../utils/customWrapper");
const { verifyToken, createAccessToken } = require("../utils/jwt");
const COOKIE_NAME = require("../utils/cookieName");
const { accessTokenOptions } = require("../config/cookies");
const { getPool } = require("../database/db");

const verifyAccessToken = (tokenKey) =>
  tryCatchWrapperWithDb(getPool())(async (req, res, next, client) => {
    const token = req.cookies[tokenKey];
    if (!token) {
      if (tokenKey === COOKIE_NAME.ACCESS_TOKEN && !req.cookies[COOKIE_NAME.REFRESH_TOKEN]) {
        throw customErrorResponse({ status: 401, message: "로그인 필요" });
      } else if (tokenKey === COOKIE_NAME.EMAIL_AUTH_SEND) {
        throw customErrorResponse({ status: 401, message: "인증번호 이메일 전송되지 않음" });
      } else if (tokenKey === COOKIE_NAME.EMAIL_AUTH_VERIFIED) {
        throw customErrorResponse({ status: 401, message: "이메일 인증되지 않음" });
      } else if (tokenKey === COOKIE_NAME.PASSWORD_RESET) {
        throw customErrorResponse({ status: 401, message: "비밀번호 변경 인증 정보 없음" });
      } else if (tokenKey === COOKIE_NAME.OAUTH_INDEX) {
        throw customErrorResponse({ status: 401, message: "카카오 인증되지 않음" });
      }
    }

    const { isValid, results } = verifyToken({ token });
    if (!isValid) {
      if (
        tokenKey === COOKIE_NAME.ACCESS_TOKEN &&
        (results === "TokenExpiredError" || results === "NoTokenError")
      ) {
        const { isValid, results: verifyResults } = verifyToken({
          token: req.cookies[COOKIE_NAME.REFRESH_TOKEN],
          isRefresh: true,
        });

        // 리프레시 토큰 확인
        if (!isValid) {
          if (verifyResults === "TokenExpiredError") {
            throw customErrorResponse({ status: 401, message: "로그인 필요" });
          } else if (verifyResults === "JsonWebTokenError") {
            throw customErrorResponse({ status: 401, message: "잘못된 토큰" });
          } else {
            throw customErrorResponse({ status: 401, message: verifyResults });
          }
        }

        const data = await client.query(
          `
            SELECT role, oauth_idx, provider, TO_TIMESTAMP(refresh_expires_in) > NOW() AS is_existed
            FROM users.lists list
            LEFT JOIN users.oauth oauth ON list.oauth_idx = oauth.idx
            WHERE list.idx = $1 
            AND list.is_deleted = false
            AND (oauth.is_deleted = false OR oauth.idx IS NULL);
          `,
          [verifyResults.users_idx]
        );

        let payload = {
          users_idx: verifyResults.users_idx,
          role: data.rows[0].role,
        };
        if (data.rows[0]?.is_existed === null || data.rows[0]?.is_existed === undefined) {
          payload = { ...payload, provider: "LOCAL" };
        } else if (data.rows[0].is_existed === false) {
          payload = { ...payload, provider: data.rows[0].provider };
        } else {
          throw customErrorResponse({ status: 401, message: "로그인 필요" });
        }

        const { isCreated, results: createResults } = createAccessToken({ payload });
        if (!isCreated) throw customErrorResponse({ status: 500, message: createResults });

        res.cookie(COOKIE_NAME.ACCESS_TOKEN, createResults, accessTokenOptions);

        req[tokenKey] = payload;

        return next();
      } else if (results === "JsonWebTokenError") {
        throw customErrorResponse({ status: 401, message: "잘못된 토큰" });
      } else {
        throw customErrorResponse({ status: 401, message: results });
      }
    }

    req[tokenKey] = results;

    return next();
  });

module.exports = verifyAccessToken;
