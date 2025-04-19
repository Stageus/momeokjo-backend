const customErrorResponse = require("../utils/customErrorResponse");
const { tryCatchWrapper } = require("../utils/customWrapper");
const { verifyToken } = require("../utils/jwt");
const COOKIE_NAME = require("../utils/cookieName");

const verifyAccessToken = (tokenKey) =>
  tryCatchWrapper(async (req, res, next) => {
    const token = req.cookies[tokenKey];
    if (!token) {
      if (tokenKey === COOKIE_NAME.ACCESS_TOKEN) {
        throw customErrorResponse({ status: 401, message: "로그인 필요" });
      } else if (tokenKey === COOKIE_NAME.EMAIL_AUTH_SEND) {
        throw customErrorResponse({ status: 401, message: "인증번호 이메일 전송되지 않음" });
      } else if (tokenKey === COOKIE_NAME.EMAIL_AUTH_VERIFIED) {
        throw customErrorResponse({ status: 401, message: "이메일 인증되지 않음" });
      } else if (tokenKey === COOKIE_NAME.PASSWORD_RESET) {
        throw customErrorResponse({ status: 401, message: "비밀번호 변경 인증 정보 없음" });
      } else if (tokenKey === COOKIE_NAME.OAUTH_INDEX) {
        throw customErrorResponse({ status: 401, message: "카카오 인증되지 않음" });
      } else {
        throw customErrorResponse({ status: 401, message: "토큰 없음" });
      }
    }

    const { isValid, results } = verifyToken({ token });

    if (!isValid) {
      if (results === "TokenExpiredError") {
        throw customErrorResponse({ status: 401, message: "토큰 만료" });
      } else if (results === "JsonWebTokenError") {
        throw customErrorResponse({ status: 401, message: "유효하지 않은 토큰" });
      } else {
        throw customErrorResponse({ status: 500, message: "토큰 디코딩 중 오류 발생" });
      }
    }

    req[tokenKey] = results;

    next();
  });

module.exports = verifyAccessToken;
