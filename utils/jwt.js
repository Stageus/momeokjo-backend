const jwt = require("jsonwebtoken");
const customErrorResponse = require("./customErrorResponse");

exports.createAccessToken = ({ payload }) => {
  try {
    if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0)
      throw new Error("payload 확인 필요");

    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_ACCESS_EXPIRES_IN)
      throw new Error("access 토큰 생성 jwt 환경 변수 확인 필요");

    const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: `${process.env.JWT_ACCESS_EXPIRES_IN}m`,
    });

    return token;
  } catch (err) {
    throw customErrorResponse(500, err.message || "access 토큰 생성 중 오류 발생");
  }
};

exports.createRefreshToken = ({ payload }) => {
  try {
    if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0)
      throw new Error("payload 확인 필요");

    if (!process.env.JWT_REFRESH_SECRET || !process.env.JWT_REFRESH_EXPIRES_IN)
      throw new Error("refresh 토큰 생성 jwt 환경 변수 확인 필요");

    const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: `${process.env.JWT_REFRESH_EXPIRES_IN}d`,
    });

    return token;
  } catch (err) {
    throw customErrorResponse({
      status: 500,
      message: err.message || "refresh 토큰 생성 중 오류 발생",
    });
  }
};

exports.verifyToken = ({ token, isRefresh = false }) => {
  try {
    if (!token || typeof token !== "string") throw new Error("token 확인 필요");

    if (isRefresh === false && !process.env.JWT_ACCESS_SECRET)
      throw new Error("환경 변수 JWT_ACCESS_SECRET 확인 필요");

    if (isRefresh === true && !process.env.JWT_REFRESH_SECRET)
      throw new Error("환경 변수 JWT_REFRESH_SECRET 확인 필요");

    const key = isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_ACCESS_SECRET;
    const decoded = jwt.verify(token, key);

    return { isValid: true, results: decoded };
  } catch (err) {
    throw customErrorResponse({ status: 500, message: err.message || "토큰 디코딩 중 오류 발생" });
  }
};
