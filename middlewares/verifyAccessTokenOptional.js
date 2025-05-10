const { tryCatchWrapper } = require("../utils/customWrapper");
const { verifyToken } = require("../utils/jwt");

const verifyAccessTokenOptional = (tokenKey) =>
  tryCatchWrapper(async (req, res, next) => {
    const token = req.cookies[tokenKey];
    if (!token) {
      req[tokenKey] = null;

      return next();
    }

    const { isValid, results } = verifyToken({ token });

    if (!isValid) {
      req[tokenKey] = null;

      return next();
    }

    req[tokenKey] = results;
    next();
  });

module.exports = verifyAccessTokenOptional;
