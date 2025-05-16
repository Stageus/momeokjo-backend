const router = require("express").Router();
const { createValidateChain } = require("../../middlewares/createValidateChain");
const { validateRequest } = require("../../middlewares/validateRequest");
const ac = require("./controller");
const schema = require("./schema");

// 로그인
router.post("/auth/signin", createValidateChain(schema.signIn), validateRequest, ac.signIn);

module.exports = router;
