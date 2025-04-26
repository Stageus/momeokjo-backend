exports.baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "develop",
  sameSite: "None",
};

exports.accessTokenOptions = {
  ...exports.baseCookieOptions,
  maxAge: 60 * 15 * 1000,
};

exports.refreshTokenOptions = {
  ...exports.baseCookieOptions,
  maxAge: 60 * 60 * 30 * 1000,
};
