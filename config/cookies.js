exports.baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "develop",
  sameSite: process.env.NODE_ENV === "local" ? "Lax" : "None",
};

exports.accessTokenOptions = {
  ...exports.baseCookieOptions,
  maxAge: 60 * 1000 * parseInt(process.env.JWT_ACCESS_EXPIRES_IN),
};

exports.refreshTokenOptions = {
  ...exports.baseCookieOptions,
  maxAge: 60 * 60 * 1000 * parseInt(process.env.JWT_REFRESH_EXPIRES_IN),
};
