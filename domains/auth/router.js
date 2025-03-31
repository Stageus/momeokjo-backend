const router = require("express").Router();
const ac = require("./controller");

// 로그인
router.post("signin", ac.signIn);

// 로그아웃
router.delete("/signout", ac.signOut);

// 회원가입
router.post("/signup", ac.signUp);

// oauth 회원가입
router.post("/oauth/signup", ac.signUpWithOauth);

// 아이디 찾기
router.get("/findid", ac.getUserId);

// 비밀번호 찾기
router.get("/findpw", ac.createRequestPasswordReset);

// 비밀번호 초기화
router.post("/resetpw", ac.resetPassword);

// 로그인 상태 조회
router.get("/status", ac.checkLoginStatus);

// 이메일 인증번호 전송
router.post("/verify-email", ac.sendEmailVerificationCode);

// 이메일 인증번호 확인
router.post("/verify-email/confirm", ac.checkEmailVerificationCode);

// 카카오 로그인
router.get("/oauth/kakao", ac.signInWithKakaoAuth);

// 카카오 토큰발급 요청
router.get("/oauth/kakao/redirect", ac.redirectToOauthProvider);

module.exports = router;
