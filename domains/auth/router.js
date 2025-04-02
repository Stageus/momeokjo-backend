const router = require("express").Router();
const { createValidateChain } = require("../../middlewares/createValidateChain");
const { validateRequest } = require("../../middlewares/validateRequest");
const ac = require("./controller");
const schema = require("./schema");

// 이메일 인증번호 전송
router.post(
  "/verify-email",
  createValidateChain(schema.sendEmailVerificationCode),
  validateRequest,
  ac.sendEmailVerificationCode
);

module.exports = router;
