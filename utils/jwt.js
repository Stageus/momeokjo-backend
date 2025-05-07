const jwt = require("jsonwebtoken");

exports.createAccessToken = ({ payload }) => {
  try {
    if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0)
      return { isCreated: false, results: "payload 확인 필요" };

    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_ACCESS_EXPIRES_IN)
      return { isCreated: false, results: "access 토큰 생성 jwt 환경 변수 확인 필요" };

    const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: `${process.env.JWT_ACCESS_EXPIRES_IN}m`,
    });

    return { isCreated: true, results: token };
  } catch (err) {
    return { isCreated: false, results: err.message || "access 토큰 생성 중 오류 발생" };
  }
};

exports.createRefreshToken = ({ payload }) => {
  try {
    if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0)
      return { isCreated: false, results: "payload 확인 필요" };

    if (!process.env.JWT_REFRESH_SECRET || !process.env.JWT_REFRESH_EXPIRES_IN)
      return { isCreated: false, results: "refresh 토큰 생성 jwt 환경 변수 확인 필요" };

    const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: `${process.env.JWT_REFRESH_EXPIRES_IN}d`,
    });

    return { isCreated: true, results: token };
  } catch (err) {
    return { isCreated: false, results: err.message || "refresh 토큰 생성 중 오류 발생" };
  }
};

exports.verifyToken = ({ token, isRefresh = false }) => {
  try {
    if (!token || typeof token !== "string") return { isValid: false, results: "NoTokenError" };

    if (isRefresh === false && !process.env.JWT_ACCESS_SECRET)
      return { isValid: false, results: "환경 변수 JWT_ACCESS_SECRET 확인 필요" };

    if (isRefresh === true && !process.env.JWT_REFRESH_SECRET)
      return { isValid: false, results: "환경 변수 JWT_REFRESH_SECRET 확인 필요" };

    const key = isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_ACCESS_SECRET;
    const decoded = jwt.verify(token, key);

    return { isValid: true, results: decoded };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return { isValid: false, results: "TokenExpiredError" };
    } else if (err.name === "JsonWebTokenError") {
      return { isValid: false, results: "JsonWebTokenError" };
    } else {
      return { isValid: false, results: err.message || "토큰 디코딩 중 오류 발생" };
    }
  }
};
