const authService = require("./authService");
const asyncWrapper = require("../utils/asyncWrapper");
const { validateRequest } = require("../middlewares/validationMiddleware");

const signin = [
  validateRequest({
    body: {
      id: { required: true },
      pw: { required: true },
    },
  }),
  asyncWrapper(async (req, res) => {
    const { id, pw } = req.body;
    const userData = await authService.signin({ id, pw });
    res.status(200).send({ message: "로그인 성공", user: userData });
  }),
];

const signout = [
  asyncWrapper(async (req, res) => {
    await authService.signout(req);
    res.status(200).send({ message: "로그아웃 성공" });
  }),
];

const signup = [
  validateRequest({
    body: {
      id: { required: true },
      pw: { required: true },
      nickname: { required: true },
      code: { required: true },
    },
  }),
  asyncWrapper(async (req, res) => {
    const { id, pw, nickname, code } = req.body;
    await authService.signup({ id, pw, nickname, code, session: req.session });
    res.status(200).send({ message: "회원가입 성공" });
  }),
];

const oauthSignup = [
  validateRequest({
    body: {
      nickname: { required: true },
      code: { required: true },
    },
  }),
  asyncWrapper(async (req, res) => {
    const { nickname, code } = req.body;
    await authService.oauthSignup({ nickname, code, session: req.session });
    res.status(200).send({ message: "OAuth 회원가입 성공" });
  }),
];

const findId = [
  validateRequest({
    body: {
      email: { required: true },
    },
  }),
  asyncWrapper(async (req, res) => {
    const { email } = req.body;
    const id = await authService.findId({ email });
    res.status(200).send({ message: "아이디 조회 성공", id });
  }),
];

const findPw = [
  validateRequest({
    body: {
      id: { required: true },
      email: { required: true },
    },
  }),
  asyncWrapper(async (req, res) => {
    const { id, email } = req.body;
    await authService.findPw({ id, email });
    res.status(200).send({ message: "비밀번호 조회 성공" });
  }),
];

const resetPw = [
  validateRequest({
    body: {
      id: { required: true },
      email: { required: true },
      pw: { required: true },
    },
  }),
  asyncWrapper(async (req, res) => {
    const { id, email, pw } = req.body;
    await authService.resetPw({ id, email, pw });
    res.status(200).send({ message: "비밀번호 변경 성공" });
  }),
];

const status = [
  asyncWrapper(async (req, res) => {
    const user = await authService.status({ session: req.session });
    res.status(200).send({ message: "상태 조회 성공", ...user });
  }),
];

const verifyEmail = [
  validateRequest({
    body: {
      email: { required: true },
    },
  }),
  asyncWrapper(async (req, res) => {
    const { email } = req.body;
    await authService.verifyEmail({ email, session: req.session });
    res.status(200).send({ message: "이메일 인증 코드 전송 성공" });
  }),
];

const verifyEmailConfirm = [
  validateRequest({
    body: {
      code: { required: true },
    },
  }),
  asyncWrapper(async (req, res) => {
    const { code } = req.body;
    await authService.verifyEmailConfirm({ code, session: req.session });
    res.status(200).send({ message: "이메일 인증 확인 성공" });
  }),
];

const kakaoAuth = [
  asyncWrapper(async (req, res) => {
    const url = await authService.kakaoAuth();
    res.redirect(url);
  }),
];

const kakaoRedirect = [
  asyncWrapper(async (req, res) => {
    const result = await authService.kakaoRedirect({
      query: req.query,
      session: req.session,
    });
    res.status(200).send({ message: "카카오 인증 성공", ...result });
  }),
];

module.exports = {
  signin,
  signout,
  signup,
  oauthSignup,
  findId,
  findPw,
  resetPw,
  status,
  verifyEmail,
  verifyEmailConfirm,
  kakaoAuth,
  kakaoRedirect,
};
