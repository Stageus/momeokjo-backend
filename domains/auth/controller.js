const as = require("./service");
const { tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const { commonErrorResponse } = require("../../utils/customErrorResponse");
const { createAccessToken, verifyToken } = require("../../utils/jwt");

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
