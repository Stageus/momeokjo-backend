const express = require("express");
const router = express.Router();
const authController = require("./authController");

router.post("signin", authController.signin);
router.delete("/signout", authController.signout);
router.post("/signup", authController.signup);

router.post("/oauth/signup", authController.oauthSignup);
router.get("/findid", authController.findId);
router.get("/findpw", authController.findPw);
router.post("/resetpw", authController.resetPw);
router.get("/status", authController.status);

router.post("/verify-email", authController.verifyEmail);
router.post("/verify-email/confirm", authController.verifyEmailConfirm);
router.get("/oauth/kakao", authController.kakaoAuth);
router.get("/oauth/kakao/redirect", authController.kakaoRedirect);

module.exports = router;
