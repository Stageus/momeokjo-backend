const commonErrorResponse = require("../utils/customErrorResponse");
const { tryCatchWrapper } = require("../utils/customWrapper");
const { verifyToken } = require("../utils/jwt");

const verifyAccessToken = tryCatchWrapper(async (req, res, next) => {
  for (let key of Object.keys(req.cookies)) {
    if (key === "refreshToken") continue;

    const { isValid, results } = verifyToken(req.cookies[key]);

    if (!isValid) {
      if (results === "TokenExpiredError") {
        throw commonErrorResponse(401, "토큰 만료");
      } else if (results === "JsonWebTokenError") {
        throw commonErrorResponse(401, "유효하지 않은 토큰");
      } else {
        throw commonErrorResponse(500, "토큰 디코딩 중 오류 발생");
      }
    }

    req[key] = results;
  }

  next();
});

module.exports = verifyAccessToken;
