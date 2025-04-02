const as = require("./service");
const { tryCatchWrapperWithDb } = require("../../utils/customWrapper");
const { commonErrorResponse } = require("../../utils/customErrorResponse");
const { createAccessToken } = require("../../utils/jwt");

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
