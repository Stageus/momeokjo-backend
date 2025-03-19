const { commonErrorResponse } = require("../../utils/customErrorResponse");
const {
  tryCatchWrapperWithDb,
  tryCatchWrapper,
  tryCatchWrapperWithDbTransaction,
} = require("../../utils/customWrapper");
const nodemailer = require("nodemailer");
const axios = require("axios");

exports.signin = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { id, pw } = req.body;
  if (!id || !pw) throw commonErrorResponse(400, "입력값 확인 필요");

  await client.query(
    "SELECT idx, nickname FROM users.lists WHERE id=$1 AND pw=$2",
    [id, pw]
  );
  if (!user.rows.length) throw commonErrorResponse(404, "계정 없음");
});

exports.signout = async (req, res) => {
  if (!req.cookies.token) throw commonErrorResponse(401, "로그인 필요");
  res.clearCookie("token").status(200).json({ message: "요청 처리 성공" });
};

exports.signup = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { id, pw, nickname, code } = req.body;
  if (!id || !pw || !nickname || !code)
    throw commonErrorResponse(400, "입력값 확인 필요");

  if (!req.session.isEmailVerified || req.session.verifyCode !== code)
    throw commonErrorResponse(403, "권한 없음");

  const email = req.session.email;

  await client.query(
    "INSERT INTO users.lists (id, pw, nickname, email, role) VALUES ($1, $2, $3, $4, $5)",
    [id, pw, nickname, email, "USER"]
  );

  delete req.session.verifyCode;
  delete req.session.isEmailVerified;
  delete req.session.email;

  res.status(200).json({ message: "요청 처리 성공" });
});

exports.oauthSignup = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { nickname, code } = req.body;
  if (!nickname || !code) throw commonErrorResponse(400, "입력값 확인 필요");
  if (!req.session.isEmailVerified || req.session.verifyCode !== code)
    throw commonErrorResponse(403, "권한 없음");

  const email = req.session.email;

  await client.query(
    "INSERT INTO users.lists (nickname, email, role) VALUES ($1, $2, $3)",
    [nickname, email, "USER"]
  );

  delete req.session.verifyCode;
  delete req.session.isEmailVerified;
  delete req.session.email;

  res.status(200).json({ message: "요청 처리 성공" });
});

exports.findId = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { email } = req.body;
  if (!email) throw commonErrorResponse(400, "입력값 확인 필요");

  const user = await client.query("SELECT id FROM users.lists WHERE email=$1", [
    email,
  ]);
  if (!user.rows.length) throw commonErrorResponse(404, "계정 없음");

  return user.rows[0].id;
});

exports.findPw = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { id, email } = req.body;
  if (!id || !email) throw commonErrorResponse(400, "입력값 확인 필요");

  const user = await client.query(
    "SELECT idx FROM users.lists WHERE id=$1 AND email=$2",
    [id, email]
  );
  if (!user.rows.length) throw commonErrorResponse(404, "계정 없음");

  res.status(200).json({ message: "요청 처리 성공" });
});

exports.resetPw = tryCatchWrapperWithDb(async (req, res, next, client) => {
  const { id, email, pw } = req.body;
  const user = await client.query(
    "SELECT idx FROM users.lists WHERE id=$1 AND email=$2",
    [id, email]
  );
  if (!user.rows.length) throw commonErrorResponse(404, "계정 없음");
  const changeUser = await client.query(
    "UPDATE users.lists SET pw=$1 WHERE id=$2 AND email=$3",
    [pw, id, email]
  );

  res.status(200).json({ message: "비밀번호 변경 성공" });
});

exports.verifyEmail = tryCatchWrapper(async (req, res, next) => {
  const { email } = req.body;
  if (!email) throw commonErrorResponse(400, "입력값 확인 필요");

  const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
  req.session.verifyCode = verifyCode;
  req.session.email = email;
  req.session.isEmailVerified = false;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "이메일 인증 코드",
    text: `인증번호: ${verifyCode}`,
  });

  res.status(200).json({ message: "요청 처리 성공" });
});

exports.verifyEmailConfirm = tryCatchWrapper(async (req, res, next) => {
  const { code } = req.body;

  if (!code) throw commonErrorResponse(400, "입력값 확인 필요");
  if (!req.session.verifyCode)
    throw commonErrorResponse(404, "인증번호 전송내역 없음");

  if (req.session.verifyCode !== code.toString())
    throw commonErrorResponse(403, "권한 없음");

  req.session.isEmailVerified = true;

  res.status(200).json({ message: "요청 처리 성공" });
});

exports.kakaoAuth = async () => {
  const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
  const REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

  if (!REST_API_KEY || !REDIRECT_URI) {
    throw commonErrorResponse(500, "카카오 설정 정보가 없습니다.");
  }

  return `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
};

exports.kakaoRedirect = tryCatchWrapperWithDb(
  async (req, res, next, client) => {
    const { code, error } = req.query;

    if (error || !code) {
      throw commonErrorResponse(400, "카카오 인증 실패");
    }

    const tokenResponse = await axios({
      method: "POST",
      url: "https://kauth.kakao.com/oauth/token",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_REST_API_KEY,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code,
      }).toString(),
    });

    const accessToken = tokenResponse.data.access_token;
    const refreshToken = tokenResponse.data.refresh_token; // ✅ 추가된 부분

    const profileRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id: provider_user_id, kakao_account } = profileRes.data;

    if (!kakao_account || !kakao_account.email) {
      throw commonErrorResponse(
        403,
        "카카오에서 이메일 정보를 제공하지 않았습니다."
      );
    }

    const email = kakao_account.email;

    const oauthUser = await client.query(
      "SELECT u.idx, u.nickname FROM users.oauth o JOIN users.lists u ON o.users_idx = u.idx WHERE provider=$1 AND provider_user_id=$2 AND o.is_deleted = false",
      ["kakao", provider_user_id]
    );

    if (oauthUser.rows.length) {
      const user = oauthUser.rows[0];
      req.session.userIdx = user.idx;
      req.session.nickname = user.nickname;
      res.status(200).json({ message: "요청 처리 성공" });
    } else {
      const existingUser = await client.query(
        "SELECT idx, nickname FROM users.lists WHERE email=$1 AND is_deleted=false",
        [email]
      );

      if (existingUser.rows.length) {
        const users_idx = existingUser.rows[0].idx;

        await client.query(
          "INSERT INTO users.oauth (users_idx, provider, provider_user_id, refresh_token) VALUES ($1, $2, $3, $4)",
          [users_idx, "kakao", provider_user_id, refreshToken] // ✅ 추가된 부분
        );

        req.session.userIdx = existingUser.rows[0].idx;
        req.session.nickname = existingUser.rows[0].nickname;

        res.status(200).json({ message: "요청 처리 성공" });
      } else {
        req.session.oauth = {
          provider: "kakao",
          provider_user_id,
          email,
          refreshToken, // ✅ 나중에 가입할 때 사용 가능
        };
        throw commonErrorResponse(403, "추가 회원정보 입력 필요");
      }
    }
  }
);
