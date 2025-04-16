const router = require("express").Router();
const { createValidateChain } = require("../../middlewares/createValidateChain");
const { validateRequest } = require("../../middlewares/validateRequest");
const verifyAccessToken = require("../../middlewares/verifyAccessToken");
const ac = require("./controller");
const schema = require("./schema");

// 로그인
router.post("/signin", createValidateChain(schema.signIn), validateRequest, ac.signIn);

// 로그아웃
router.delete("/signout", verifyAccessToken("accessToken"), ac.signOut);

// 회원가입
router.post(
  "/signup",
  verifyAccessToken("emailVerified"),
  createValidateChain(schema.signUp),
  validateRequest,
  ac.signUp
);

// oauth 회원가입
router.post(
  "/oauth/signup",
  verifyAccessToken("oauthIdx"),
  verifyAccessToken("emailVerified"),
  createValidateChain(schema.signUpWithOauth),
  validateRequest,
  ac.signUpWithOauth
);

// 아이디 찾기
router.post("/findid", createValidateChain(schema.findId), validateRequest, ac.getUserId);

// 비밀번호 찾기
router.post(
  "/findpw",
  createValidateChain(schema.findPw),
  validateRequest,
  ac.createRequestPasswordReset
);

// 비밀번호 초기화
router.put(
  "/resetpw",
  verifyAccessToken("resetPw"),
  createValidateChain(schema.resetPw),
  validateRequest,
  ac.resetPassword
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
  verifyAccessToken("email"),
  createValidateChain(schema.checkEmailVerificationCode),
  validateRequest,
  ac.checkEmailVerificationCode
);

// 카카오 로그인
router.get("/oauth/kakao", ac.signInWithKakaoAuth);

// 카카오 토큰발급 요청
router.get("/oauth/kakao/redirect", ac.checkOauthAndRedirect);

// 로그인 상태 조회
router.get("/status", verifyAccessToken("accessToken"), ac.getStatus);

module.exports = router;
