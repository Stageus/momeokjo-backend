const as = require("./service");
const { tryCatchWrapper, tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const { commonErrorResponse } = require("../../utils/customErrorResponse");
const { createAccessToken, verifyToken } = require("../../utils/jwt");
const { encrypt } = require("../../utils/algorithm");

// 회원가입
exports.signUp = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const token = req.cookies.email;
  const { id, pw, nickname, code } = req.body;

  // 토큰 검증
  const { isValid, results } = verifyToken(token);
  if (
    !isValid ||
    (typeof results === "object" && Object.keys(results).length === 0) ||
    !results.email ||
    !results
  ) {
    throw commonErrorResponse(403, "인증되지 않은 사용자입니다.");
  }

  // 인증번호 확인
  const isValidCode = await as.checkVerificationCodeAtDb(client, results.email, code);
  if (!isValidCode) {
    throw commonErrorResponse(400, "잘못된 인증번호입니다.");
  }

  await as.createUserAtDb(client, id, pw, nickname, results.email);

  // 쿠키 삭제
  res.clearCookie("email", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.status(200).json({ message: "회원가입 성공" });
});

// 아이디 찾기
exports.getUserId = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { email } = req.body;

  const id = await as.getUserIdFromDb({ email });
  if (!id) throw commonErrorResponse(404, "계정 없음");

  res.status(200).json({ message: "아이디 조회 성공", id });
});

// 이메일 인증번호 전송
exports.sendEmailVerificationCode = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { email } = req.body;

  // 이메일 확인
  const isExistedEmail = await as.checkIsExistedEmailFromDb(client, email);

  if (isExistedEmail) {
    throw commonErrorResponse(409, "이미 회원가입에 사용된 이메일입니다.");
  }

  // 이메일 인증번호 생성
  const code = as.createVerificationCode();

  // 데이터베이스에 인증번호 저장
  await as.saveVerificationCodeAtDb(client, email, code);

  // 이메일 인증번호 전송
  await as.sendEmailVerificationCode(email, code);

  // 토큰 생성
  const token = createAccessToken({ email }, "15min");

  // 쿠키 생성
  res.cookie("email", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 60 * 15 * 1000,
  });

  res.status(200).json({ message: "이메일 인증 코드 전송 성공" });
});

exports.checkEmailVerificationCode = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const token = req.cookies.email;
  const { code } = req.body;

  // 토큰 검증
  const { isValid, results } = verifyToken(token);
  if (
    !isValid ||
    (typeof results === "object" && Object.keys(results).length === 0) ||
    !results.email ||
    !results
  ) {
    throw commonErrorResponse(403, "인증되지 않은 사용자입니다.");
  }

  // 인증번호 확인
  const isValidCode = await as.checkVerificationCodeAtDb(client, results.email, code);
  if (!isValidCode) {
    throw commonErrorResponse(400, "잘못된 인증번호입니다.");
  }

  res.status(200).json({ message: "요청 처리 성공" });
});

// 카카오 로그인
exports.signInWithKakaoAuth = tryCatchWrapper((req, res, next, client) => {
  const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
  const REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

  const url = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

  res.redirect(url);
});

// 카카오 토큰발급 요청
exports.checkOauthAndRedirect = tryCatchWrapper(async (req, res, next, client) => {
  const { code, error } = req.query;
  if (error || !code) throw commonErrorResponse(400, "카카오 인증 실패");

  const { accessToken, refreshToken } = await as.getKakaoToken(code);
  const { provider_user_id } = await as.getKakaoUserInfo(accessToken);
  const { isExistedOauthUser, users_idx } = await as.checkOauthUser(client, provider_user_id);

  if (!isExistedOauthUser || !users_idx) {
    const encryptedAccessToken = await encrypt(accessToken);
    const encryptedRefreshToken = await encrypt(refreshToken);

    const oauth_idx = await as.saveOauthInfoAtDb(
      client,
      encryptedAccessToken,
      encryptedRefreshToken,
      provider_user_id
    );

    // provider_user_id 쿠키에 저장
    res.cookie("oauth_idx", oauth_idx, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 60 * 15 * 1000,
    });

    // oauth 회원가입 페이지로 리다이렉트
    res.redirect("http://localhost:3000/oauth/signup");
  } else {
    // users_idx, provider, role로 jwt 토큰 만들기
    const payload = { users_idx, provider: "KAKAO", role: "USER" };
    const token = createAccessToken(payload);

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 60 * 15 * 1000,
    });

    res.redirect("http://localhost:3000/");
  }
});
