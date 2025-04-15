const as = require("./service");
const { tryCatchWrapper, tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const customErrorResponse = require("../../utils/customErrorResponse");
const jwt = require("../../utils/jwt");
const algorithm = require("../../utils/algorithm");
const {
  baseCookieOptions,
  accessTokenOptions,
  refreshTokenOptions,
} = require("../../config/cookies");

// 로그인
exports.signIn = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { id, pw } = req.body;

  const { isUser, users_idx } = await as.checkIsUserFromDb(client, id, pw);
  if (!isUser) throw customErrorResponse(404, "계정 없음");

  const { isExpired, refreshToken } = await as.checkLocalRefreshTokenFromDb(client, users_idx);

  let newRefreshToken = "";
  const payload = { users_idx, provider: "LOCAL" };
  if (isExpired) {
    const refreshToken = jwt.createRefreshToken(payload, process.env.JWT_REFRESH_EXPIRES_IN);
    newRefreshToken = algorithm.encrypt(refreshToken);

    // 날짜 계산 오늘 + 30일;
    const now = new Date();
    const expiresIn = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

    await as.saveNewRefreshTokenAtDb(client, users_idx, newRefreshToken, expiresIn);
  }

  const accessToken = jwt.createAccessToken(payload, process.env.JWT_ACCESS_EXPIRES_IN);

  res.cookie("accessToken", accessToken, accessTokenOptions);
  res.cookie("refreshToken", isExpired ? newRefreshToken : refreshToken, refreshTokenOptions);

  res.status(200).json({ message: "요청 처리 성공" });
});

// 로그아웃
exports.signOut = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { users_idx, provider } = req.accessToken;

  if (provider === "LOCAL") {
    await as.invalidateLocalRefreshTokenAtDb(client, users_idx);
  } else {
    const oauth_idx = await as.getOauthIdxFromDb(client, users_idx);
    const { accessToken, provider_user_id } = await as.invalidateOauthRefreshTokenAtDb(
      client,
      oauth_idx
    );

    const decryptedAccessToken = algorithm.decrypt(accessToken);

    as.requestKakaoLogout(decryptedAccessToken, provider_user_id);
  }

  res.clearCookie("accessToken", baseCookieOptions);
  res.status(200).json({ message: "요청 처리 성공" });
});

// 회원가입
exports.signUp = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { email } = req.emailVerified;
  const { id, pw, nickname, code } = req.body;

  // 인증번호 확인
  const isValidCode = await as.checkVerificationCodeAtDb(client, email, code);
  if (!isValidCode) {
    throw customErrorResponse(400, "잘못된 인증번호입니다.");
  }

  await as.createUserAtDb(client, id, pw, nickname, email, null);

  // 쿠키 삭제
  res.clearCookie("emailVerified", baseCookieOptions);
  res.status(200).json({ message: "회원가입 성공" });
});

// oauth 회원가입
exports.signUpWithOauth = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { oauth_idx } = req.oauthIdx;
  const { email } = req.emailVerified;
  const { nickname, code } = req.body;

  // 인증번호 확인
  const isValidCode = await as.checkVerificationCodeAtDb(client, email, code);
  if (!isValidCode) {
    throw customErrorResponse(400, "잘못된 인증번호입니다.");
  }

  await as.createUserAtDb(client, null, null, nickname, email, oauth_idx);

  // 쿠키 삭제
  res.clearCookie("emailVerified", baseCookieOptions);
  res.clearCookie("oauthIdx", baseCookieOptions);
  res.status(200).json({ message: "회원가입 성공" });
});

// 아이디 찾기
exports.getUserId = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { email } = req.body;

  const { isUser, id } = await as.getUserIdFromDb(client, email);
  if (!isUser) throw customErrorResponse(404, "계정 없음");

  res.status(200).json({ message: "아이디 조회 성공", id });
});

// 비밀번호 찾기
exports.createRequestPasswordReset = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { id, email } = req.body;

  const isExistedUser = await as.checkUserWithIdAndEmailFromDb(client, id, email);
  if (!isExistedUser) throw customErrorResponse(404, "계정 없음");

  const token = jwt.createAccessToken({ id, email }, process.env.JWT_ACCESS_EXPIRES_IN);
  res.cookie("resetPw", token, accessTokenOptions);
  res.status(200).json({ message: "요청 처리 성공" });
});

// 비밀번호 변경
exports.resetPassword = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { id, email } = req.resetPw;
  const { pw } = req.body;

  const isExistedUser = await as.checkUserWithIdAndEmailFromDb(client, id, email);
  if (!isExistedUser) throw customErrorResponse(404, "계정 없음");

  await as.updatePasswordAtDb(client, id, pw, email);

  res.status(200).json({ message: "비밀번호 변경 성공" });
});

// 이메일 인증번호 전송
exports.sendEmailVerificationCode = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { email } = req.body;

  // 이메일 확인
  const isExistedEmail = await as.checkIsExistedEmailFromDb(client, email);
  if (isExistedEmail) {
    throw customErrorResponse(409, "이미 회원가입에 사용된 이메일입니다.");
  }

  // 이메일 인증번호 생성
  const code = as.createVerificationCode();

  // 데이터베이스에 인증번호 저장
  await as.saveVerificationCodeAtDb(client, email, code);

  // 이메일 인증번호 전송
  await as.sendEmailVerificationCode(email, code);

  // 토큰 생성
  const token = jwt.createAccessToken({ email }, process.env.JWT_ACCESS_EXPIRES_IN);

  // 쿠키 생성
  res.cookie("email", token, accessTokenOptions);
  res.status(200).json({ message: "이메일 인증 코드 전송 성공" });
});

exports.checkEmailVerificationCode = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { email } = req.email;
  const { code } = req.body;

  // 인증번호 확인
  const isValidCode = await as.checkVerificationCodeAtDb(client, email, code);
  if (!isValidCode) {
    throw customErrorResponse(400, "잘못된 인증번호입니다.");
  }

  res.clearCookie("email", baseCookieOptions);
  res.cookie("emailVerified", { email }, accessTokenOptions);
  res.status(200).json({ message: "요청 처리 성공" });
});

// 카카오 로그인
exports.signInWithKakaoAuth = tryCatchWrapper((req, res, next) => {
  const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
  const REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

  if (!REST_API_KEY || !REDIRECT_URI)
    throw customErrorResponse(500, "환경변수 REST_API_KEY, REDIRECT_URI 확인 필요");

  const url = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

  res.redirect(url);
});

// 카카오 토큰발급 요청
exports.checkOauthAndRedirect = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { code, error } = req.query;
  if (error || !code) throw customErrorResponse(400, "카카오 인증 실패");

  const { accessToken, refreshToken, refreshTokenExpiresIn } = await as.getTokenFromKakao(code);
  const provider_user_id = await as.getProviderIdFromKakao(accessToken);
  const { isExisted, users_idx } = await as.checkOauthUserAtDb(client, provider_user_id);

  if (!isExisted) {
    const encryptedAccessToken = await algorithm.encrypt(accessToken);
    const encryptedRefreshToken = await algorithm.encrypt(refreshToken);

    const oauth_idx = await as.saveOauthInfoAtDb(
      client,
      encryptedAccessToken,
      encryptedRefreshToken,
      refreshTokenExpiresIn,
      provider_user_id
    );

    const token = jwt.createAccessToken({ oauth_idx });
    res.cookie("oauthIdx", token, accessTokenOptions);
    res.redirect("http://localhost:3000/oauth/signup");
  } else {
    const payload = { users_idx, provider: "KAKAO", role: "USER" };
    const token = jwt.createAccessToken(payload);

    res.cookie("accessToken", token, accessTokenOptions);
    res.redirect("http://localhost:3000/");
  }
});
