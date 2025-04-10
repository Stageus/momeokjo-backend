const customErrorResponse = require("../utils/customErrorResponse");
const { tryCatchWrapper } = require("../utils/customWrapper");
const { verifyToken } = require("../utils/jwt");

const verifyAccessToken = (tokenKey) =>
  tryCatchWrapper(async (req, res, next) => {
    const token = req.cookies[tokenKey];
    if (!token) throw customErrorResponse(401, "토큰 없음");

    const { isValid, results } = verifyToken(token);

    if (!isValid) {
      if (results === "TokenExpiredError") {
        throw customErrorResponse(401, "토큰 만료");
      } else if (results === "JsonWebTokenError") {
        throw customErrorResponse(401, "유효하지 않은 토큰");
      } else {
        throw customErrorResponse(500, "토큰 디코딩 중 오류 발생");
      }
    }

    req[tokenKey] = results;

    next();
  });

module.exports = verifyAccessToken;
