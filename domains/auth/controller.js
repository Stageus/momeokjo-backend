const as = require("./service");
const { tryCatchWrapper, tryCatchWrapperWithDb } = require("../../utils/customWrapper");

// 로그인
exports.signIn = [
  // validate({
  //   body: {
  //     id: { required: true },
  //     pw: { required: true },
  //   },
  // }),
  tryCatchWrapperWithDb(async (req, res) => {
    const { id, pw } = req.body;

    await as.checkIsUserFromDb({ id, pw });

    res.status(200).send({ message: "로그인 성공" });
  }),
];

// 로그아웃
exports.signOut = [
  tryCatchWrapper(async (req, res) => {
    await as.clearAuthCookie(req);

    res.status(200).send({ message: "로그아웃 성공" });
  }),
];

// 회원가입
exports.signUp = [
  // validateRequest({
  //   body: {
  //     id: { required: true },
  //     pw: { required: true },
  //     nickname: { required: true },
  //     code: { required: true },
  //   },
  // }),
  tryCatchWrapperWithDb(async (req, res) => {
    const { id, pw, nickname, code } = req.body;

    await as.createUserAtDb({ id, pw, nickname, code, session: req.session });

    res.status(200).send({ message: "회원가입 성공" });
  }),
];

// oauth 회원가입
exports.signUpWithOauth = [
  // validateRequest({
  //   body: {
  //     nickname: { required: true },
  //     code: { required: true },
  //   },
  // }),
  tryCatchWrapperWithDb(async (req, res) => {
    const { nickname, code } = req.body;

    await as.createUserAtDb({ nickname, code, session: req.session });

    res.status(200).send({ message: "OAuth 회원가입 성공" });
  }),
];

// 아이디 찾기
exports.getUserId = [
  // validateRequest({
  //   body: {
  //     email: { required: true },
  //   },
  // }),
  tryCatchWrapperWithDb(async (req, res) => {
    const { email } = req.body;

    const id = await as.getUserIdFromDb({ email });

    res.status(200).send({ message: "아이디 조회 성공", id });
  }),
];

// 비밀번호 찾기
exports.createRequestPasswordReset = [
  // validateRequest({
  //   body: {
  //     id: { required: true },
  //     email: { required: true },
  //   },
  // }),
  tryCatchWrapperWithDb(async (req, res) => {
    const { id, email } = req.body;

    // 회원 여부 확인 서비스
    await as.checkIsUserFromDb({ id, email });

    // 비밀번호 변경을 위한 쿠키 생성

    res.status(200).send({ message: "비밀번호 조회 성공" });
  }),
];

// 비밀번호 초기화
exports.resetPassword = [
  // validateRequest({
  //   body: {
  //     id: { required: true },
  //     email: { required: true },
  //     pw: { required: true },
  //   },
  // }),
  tryCatchWrapperWithDb(async (req, res) => {
    const { id, email, pw } = req.body;

    await as.updatePasswordAtDb({ id, email, pw });

    res.status(200).send({ message: "비밀번호 변경 성공" });
  }),
];

// 로그인 상태 조회
exports.checkLoginStatus = [
  tryCatchWrapperWithDb(async (req, res) => {
    // 로그인 상태 확인
    const user = await as.checkLoginStatus({ session: req.session });

    res.status(200).send({ message: "상태 조회 성공", ...user });
  }),
];

// 이메일 인증번호 전송
exports.sendEmailVerificationCode = [
  // validateRequest({
  //   body: {
  //     email: { required: true },
  //   },
  // }),
  tryCatchWrapperWithDb(async (req, res) => {
    const { email } = req.body;

    // 이메일 확인

    // 이메일 인증번호 전송
    await as.sendEmailVerificationCode({ email, session: req.session });

    res.status(200).send({ message: "이메일 인증 코드 전송 성공" });
  }),
];

// 이메일 인증번호 확인
exports.checkEmailVerificationCode = [
  // validateRequest({
  //   body: {
  //     code: { required: true },
  //   },
  // }),
  tryCatchWrapperWithDb(async (req, res) => {
    const { code } = req.body;

    await as.checkEmailVerificationCode({ code, session: req.session });

    res.status(200).send({ message: "이메일 인증 확인 성공" });
  }),
];

// 카카오 로그인
exports.signInWithKakaoAuth = [
  tryCatchWrapper(async (req, res) => {
    const url = await as.signInWithKakaoAuth();

    res.redirect(url);
  }),
];

// 카카오 토큰발급 요청
exports.redirectToOauthProvider = [
  tryCatchWrapper(async (req, res) => {
    const result = await as.redirectToOauthProvider({
      query: req.query,
      session: req.session,
    });

    res.status(200).send({ message: "카카오 인증 성공", ...result });
  }),
];
