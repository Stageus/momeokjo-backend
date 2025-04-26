exports.baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "develop",
  sameSite: "None",
};

exports.accessTokenOptions = {
  ...exports.baseCookieOptions,
  expires: new Date(Date.now() + 60 * parseInt(process.env.JWT_ACCESS_EXPIRES_IN) * 1000),
};

exports.refreshTokenOptions = {
  ...exports.baseCookieOptions,
  expires: new Date(Date.now() + 60 * 60 * parseInt(process.env.JWT_REFRESH_EXPIRES_IN) * 1000),
};
