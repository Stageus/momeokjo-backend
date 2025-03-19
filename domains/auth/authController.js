const authService = require("./authService");
const { tryCatchWrapper } = require("../../utils/customWrapper");

exports.signin = tryCatchWrapper(async (req, res, next) => {
  await authService.signin(req, res, next);
});

exports.signout = tryCatchWrapper(async (req, res, next) => {
  await authService.signout(req, res, next);
});

exports.signup = tryCatchWrapper(async (req, res, next) => {
  await authService.signup(req, res, next);
});

exports.oauthSignup = tryCatchWrapper(async (req, res, next) => {
  await authService.oauthSignup(req, res, next);
});

exports.findId = tryCatchWrapper(async (req, res, next) => {
  const id = await authService.findId(req, res, next);
  res.status(200).json({ message: "요청 처리 성공", id });
});

exports.findPw = tryCatchWrapper(async (req, res, next) => {
  await authService.findPw(req, res, next);
});

exports.resetPw = tryCatchWrapper(async (req, res, next) => {
  await authService.resetPw(req, res, next);
});

exports.status = tryCatchWrapper(async (req, res, next) => {
  const user = await authService.status(req, res, next);
  res.status(200).json({ message: "요청 처리 성공", ...user });
});

exports.verifyEmail = tryCatchWrapper(async (req, res, next) => {
  await authService.verifyEmail(req, res, next);
});

exports.verifyEmailConfirm = tryCatchWrapper(async (req, res, next) => {
  await authService.verifyEmailConfirm(req, res, next);
});

exports.kakaoAuth = tryCatchWrapper(async (req, res, next) => {
  const url = await authService.kakaoAuth();
  res.redirect(url);
});

exports.kakaoRedirect = tryCatchWrapper(async (req, res, next) => {
  await authService.kakaoRedirect(req, res, next);
});
