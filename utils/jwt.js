const jwt = require("jsonwebtoken");

exports.createAccessToken = (payload, expiresIn) => {
  const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn });

  return token;
};

exports.createRefreshToken = (payload, expiresIn) => {
  const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn });

  return token;
};

exports.verifyToken = (token, isRefresh = false) => {
  try {
    const key = isRefresh ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET;

    const decoded = jwt.verify(token, key);

    return { isValid: true, results: decoded };
  } catch (err) {
    return { isValid: false, results: err.name };
  }
};
