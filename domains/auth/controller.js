const as = require("./service");
const { tryCatchWrapper, tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const customErrorResponse = require("../../utils/customErrorResponse");
const jwt = require("../../utils/jwt");
const algorithm = require("../../utils/algorithm");
const { baseCookieOptions, accessTokenOptions } = require("../../config/cookies");
const COOKIE_NAME = require("../../utils/cookieName");

// 로그인
exports.signIn = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { id, pw } = req.body;

  const { isUser, users_idx, role } = await as.checkIsUserFromDb({ client, id, pw });
  if (!isUser) throw customErrorResponse({ status: 404, message: "등록된 계정 없음" });

  const { isExpired, refreshToken } = await as.checkLocalRefreshTokenFromDb({ client, users_idx });

  let newRefreshToken = "";
  const payload = { users_idx, provider: "LOCAL", role };
  if (isExpired) {
    const refreshToken = jwt.createRefreshToken({
      payload,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });
    newRefreshToken = algorithm.encrypt(refreshToken);

    // 날짜 계산 오늘 + 30일;
    const now = new Date();
    const refresh_expired_at = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

    await as.saveNewRefreshTokenAtDb({
      client,
      users_idx,
      refreshToken: newRefreshToken,
      refresh_expired_at,
    });
  }

  const accessToken = jwt.createAccessToken({
    payload,
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });

  res.cookie(COOKIE_NAME.ACCESS_TOKEN, accessToken, accessTokenOptions);
  res.status(200).json({ message: "요청 처리 성공" });
});

// 로그아웃
exports.signOut = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { users_idx, provider } = req[COOKIE_NAME.ACCESS_TOKEN];

  if (provider === "LOCAL") {
    await as.removeLocalRefreshTokenAtDb({ client, users_idx });
  } else {
    const { accessToken, provider_user_id } = await as.getOauthAccessTokenFromDb({
      client,
      users_idx,
    });

    const decryptedAccessToken = await algorithm.decrypt(accessToken);
    await as.requestKakaoLogout({ accessToken: decryptedAccessToken, provider_user_id });
  }

  res.clearCookie(COOKIE_NAME.ACCESS_TOKEN, baseCookieOptions);
  res.status(200).json({ message: "요청 처리 성공" });
});

// 회원가입
exports.signUp = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { email } = req[COOKIE_NAME.EMAIL_AUTH_VERIFIED];
  const { id, pw, nickname } = req.body;

  await as.createUserAtDb({ client, id, pw, nickname, email, role: "USER" });

  // 쿠키 삭제
  res.clearCookie(COOKIE_NAME.EMAIL_AUTH_VERIFIED, baseCookieOptions);
  res.status(200).json({ message: "회원가입 성공" });
});

// oauth 회원가입
exports.signUpWithOauth = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { oauth_idx } = req[COOKIE_NAME.OAUTH_INDEX];
  const { email } = req[COOKIE_NAME.EMAIL_AUTH_VERIFIED];
  const { nickname } = req.body;

  await as.createUserAtDb({ client, id: null, pw: null, nickname, email, role: "USER", oauth_idx });

  // 쿠키 삭제
  res.clearCookie(COOKIE_NAME.EMAIL_AUTH_VERIFIED, baseCookieOptions);
  res.clearCookie(COOKIE_NAME.OAUTH_INDEX, baseCookieOptions);
  res.status(200).json({ message: "요청 처리 성공" });
});

// 아이디 찾기
exports.getUserId = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { email } = req.body;

  const { isUser, id } = await as.getUserIdFromDb({ client, email });
  if (!isUser) throw customErrorResponse({ status: 404, message: "해당하는 사용자 없음" });

  res.status(200).json({ message: "요청 처리 성공", data: { id } });
});

// 비밀번호 찾기
exports.createRequestPasswordReset = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { id, email } = req.body;

  const isExisted = await as.checkUserWithIdAndEmailFromDb({ client, id, email });
  if (!isExisted) throw customErrorResponse({ status: 404, message: "해당하는 사용자 없음" });

  const token = jwt.createAccessToken({
    payload: { id, email },
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });

  res.cookie(COOKIE_NAME.PASSWORD_RESET, token, accessTokenOptions);
  res.status(200).json({ message: "요청 처리 성공" });
});

// 비밀번호 변경
exports.resetPassword = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { id, email } = req[COOKIE_NAME.PASSWORD_RESET];
  const { pw } = req.body;

  const isExisted = await as.checkUserWithIdAndEmailFromDb({ client, id, email });
  if (!isExisted) throw customErrorResponse({ status: 404, message: "해당하는 사용자 없음" });

  await as.updatePasswordAtDb({ client, id, pw, email });

  res.clearCookie(COOKIE_NAME.PASSWORD_RESET, baseCookieOptions);
  res.status(200).json({ message: "요청 처리 성공" });
});

// 이메일 인증번호 전송
exports.sendEmailVerificationCode = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { email } = req.body;

  // 이메일 확인
  const isExisted = await as.checkIsExistedEmailFromDb({ client, email });
  if (isExisted) throw customErrorResponse({ status: 409, message: "중복 이메일 회원 있음" });

  // 이메일 인증번호 생성
  const code = as.createVerificationCode();

  // 데이터베이스에 인증번호 저장
  await as.saveVerificationCodeAtDb({ client, email, code });

  // 이메일 인증번호 전송
  await as.sendEmailVerificationCode({ email, code });

  // 토큰 생성
  const token = jwt.createAccessToken({
    payload: { email },
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });

  // 쿠키 생성
  res.cookie(COOKIE_NAME.EMAIL_AUTH_SEND, token, accessTokenOptions);
  res.status(200).json({ message: "이메일 인증 코드 전송 성공" });
});

exports.checkEmailVerificationCode = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { email } = req[COOKIE_NAME.EMAIL_AUTH_SEND];
  const { code } = req.body;

  // 인증번호 확인
  const isCode = await as.checkVerifyCodeFromDb({ client, email, code });
  if (!isCode)
    throw customErrorResponse({ status: 400, message: "입력값 확인 필요", target: "code" });

  const token = jwt.createAccessToken({
    payload: { email },
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });

  res.clearCookie(COOKIE_NAME.EMAIL_AUTH_SEND, baseCookieOptions);
  res.cookie(COOKIE_NAME.EMAIL_AUTH_VERIFIED, token, accessTokenOptions);
  res.status(200).json({ message: "요청 처리 성공" });
});

// 카카오 로그인
exports.signInWithKakaoAuth = tryCatchWrapper((req, res, next) => {
  const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
  const REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

  if (!REST_API_KEY || !REDIRECT_URI)
    throw customErrorResponse({
      status: 500,
      message: "환경변수 REST_API_KEY, REDIRECT_URI 확인 필요",
    });

  const url = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

  res.redirect(url);
});

// 카카오 토큰발급 요청
exports.checkOauthAndRedirect = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { code, error } = req.query;
  if (error || !code) throw customErrorResponse({ status: 400, message: "카카오 로그인 실패" });

  const { accessToken, refreshToken, refreshTokenExpiresIn } = await as.getTokenFromKakao(code);
  const provider_user_id = await as.getProviderIdFromKakao(accessToken);
  const { isExisted, users_idx } = await as.checkOauthUserAtDb({
    client,
    provider_user_id,
    provider: "KAKAO",
  });
  if (!isExisted) {
    const encryptedAccessToken = await algorithm.encrypt(accessToken);
    const encryptedRefreshToken = await algorithm.encrypt(refreshToken);

    const oauth_idx = await as.saveOauthInfoAtDb({
      client,
      encryptedAccessToken,
      encryptedRefreshToken,
      refreshTokenExpiresIn,
      provider_user_id,
      provider: "KAKAO",
    });

    const token = jwt.createAccessToken({
      payload: { oauth_idx },
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    });

    res.cookie(COOKIE_NAME.OAUTH_INDEX, token, accessTokenOptions);
    res.redirect("http://localhost:3000/oauth/signup");
  } else {
    const payload = { users_idx, provider: "KAKAO", role: "USER" };
    const token = jwt.createAccessToken({ payload, expiresIn: process.env.JWT_ACCESS_EXPIRES_IN });

    res.cookie(COOKIE_NAME.ACCESS_TOKEN, token, accessTokenOptions);
    res.redirect("http://localhost:3000/");
  }
});

exports.getStatus = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { users_idx } = req[COOKIE_NAME.ACCESS_TOKEN];

  const nickname = await as.getUserNicknameFromDb({ client, users_idx });

  res.status(200).json({ message: "요청 처리 성공", data: { users_idx, nickname } });
});
