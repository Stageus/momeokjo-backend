const router = require("express").Router();
const { createValidateChain } = require("../../middlewares/createValidateChain");
const { validateRequest } = require("../../middlewares/validateRequest");
const ac = require("./controller");
const schema = require("./schema");

// 회원가입
router.post(
  "/signup",
  createValidateChain(schema.sendEmailVerificationCode),
  validateRequest,
  ac.signUp
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

module.exports = router;
