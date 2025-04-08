const router = require("express").Router();
const { createValidateChain } = require("../../middlewares/createValidateChain");
const { validateRequest } = require("../../middlewares/validateRequest");
const verifyAccessToken = require("../../middlewares/verifyAccessToken");
const ac = require("./controller");
const schema = require("./schema");

// 로그인
router.post("/signin", createValidateChain(schema.signIn), validateRequest, ac.signIn);

// 회원가입
router.post(
  "/signup",
  verifyAccessToken("email_verified"),
  createValidateChain(schema.signUp),
  validateRequest,
  ac.signUp
);

// 아이디 찾기
router.get("/findid", createValidateChain(schema.findId), validateRequest, ac.getUserId);

// 비밀번호 찾기
router.get(
  "/findpw",
  createValidateChain(schema.findId),
  validateRequest,
  ac.createRequestPasswordReset
);

// 이메일 인증번호 전송
router.post(
  "/verify-email",
  createValidateChain(schema.sendEmailVerificationCode),
  validateRequest,
  ac.sendEmailVerificationCode
);

// 이메일 인증번호 확인
router.post(
  "/verify-email/confirm",
  createValidateChain(schema.sendEmailVerificationCode),
  validateRequest,
  ac.checkEmailVerificationCode
);

// 카카오 로그인
router.get("/oauth/kakao", ac.signInWithKakaoAuth);

// 카카오 토큰발급 요청
router.get("/oauth/kakao/redirect", ac.checkOauthAndRedirect);

module.exports = router;
