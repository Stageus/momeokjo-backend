const db = require("../../database/db");
const customError = require("../utils/customError");
const nodemailer = require("nodemailer");
const axios = require("axios");

const signin = async ({ id, pw }) => {
  if (!id || !pw) throw customError("입력값 확인 필요", 400);
  const result = await db.query(
    "SELECT idx, nickname FROM users.lists WHERE id=$1 AND pw=$2",
    [id, pw]
  );
  if (!result.rows.length) throw customError("계정 없음", 404);
  return result.rows[0];
};

const signout = async (req) => {
  if (!req.cookies.token) throw customError("로그인 필요", 401);
};

const signup = async ({ id, pw, nickname, code, session }) => {
  if (!id || !pw || !nickname || !code)
    throw customError("입력값 확인 필요", 400);
  if (!session.isEmailVerified || session.verifyCode !== code)
    throw customError("권한 없음", 403);
  const email = session.email;
  await db.query(
    "INSERT INTO users.lists (id, pw, nickname, email, role) VALUES ($1, $2, $3, $4, $5)",
    [id, pw, nickname, email, "USER"]
  );
  delete session.verifyCode;
  delete session.isEmailVerified;
  delete session.email;
};

const oauthSignup = async ({ nickname, code, session }) => {
  if (!nickname || !code) throw customError("입력값 확인 필요", 400);
  if (!session.isEmailVerified || session.verifyCode !== code)
    throw customError("권한 없음", 403);
  const email = session.email;
  await db.query(
    "INSERT INTO users.lists (nickname, email, role) VALUES ($1, $2, $3)",
    [nickname, email, "USER"]
  );
  delete session.verifyCode;
  delete session.isEmailVerified;
  delete session.email;
};

const findId = async ({ email }) => {
  if (!email) throw customError("입력값 확인 필요", 400);
  const result = await db.query("SELECT id FROM users.lists WHERE email=$1", [
    email,
  ]);
  if (!result.rows.length) throw customError("계정 없음", 404);
  return result.rows[0].id;
};

const findPw = async ({ id, email }) => {
  if (!id || !email) throw customError("입력값 확인 필요", 400);
  const result = await db.query(
    "SELECT idx FROM users.lists WHERE id=$1 AND email=$2",
    [id, email]
  );
  if (!result.rows.length) throw customError("계정 없음", 404);
};

const resetPw = async ({ id, email, pw }) => {
  const result = await db.query(
    "SELECT idx FROM users.lists WHERE id=$1 AND email=$2",
    [id, email]
  );
  if (!result.rows.length) throw customError("계정 없음", 404);
  await db.query("UPDATE users.lists SET pw=$1 WHERE id=$2 AND email=$3", [
    pw,
    id,
    email,
  ]);
};

const verifyEmail = async ({ email, session }) => {
  if (!email) throw customError("입력값 확인 필요", 400);
  const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
  session.verifyCode = verifyCode;
  session.email = email;
  session.isEmailVerified = false;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "이메일 인증 코드",
    text: `인증번호: ${verifyCode}`,
  });
};

const verifyEmailConfirm = async ({ code, session }) => {
  if (!code) throw customError("입력값 확인 필요", 400);
  if (!session.verifyCode) throw customError("인증번호 전송내역 없음", 404);
  if (session.verifyCode !== code.toString())
    throw customError("권한 없음", 403);
  session.isEmailVerified = true;
};

const kakaoAuth = async () => {
  const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
  const REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
  if (!REST_API_KEY || !REDIRECT_URI)
    throw customError("카카오 설정 정보가 없습니다.", 500);
  return `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
};

const kakaoRedirect = async ({ query, session }) => {
  const { code, error } = query;
  if (error || !code) throw customError("카카오 인증 실패", 400);
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
  const refreshToken = tokenResponse.data.refresh_token;
  const profileRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const { id: provider_user_id, kakao_account } = profileRes.data;
  if (!kakao_account || !kakao_account.email)
    throw customError("카카오에서 이메일 정보를 제공하지 않았습니다.", 403);
  const email = kakao_account.email;
  const oauthUserResult = await db.query(
    "SELECT u.idx, u.nickname FROM users.oauth o JOIN users.lists u ON o.users_idx = u.idx WHERE provider=$1 AND provider_user_id=$2 AND o.is_deleted = false",
    ["kakao", provider_user_id]
  );
  if (oauthUserResult.rows.length) {
    const user = oauthUserResult.rows[0];
    session.userIdx = user.idx;
    session.nickname = user.nickname;
    return { user, additional: false };
  } else {
    const existingUser = await db.query(
      "SELECT idx, nickname FROM users.lists WHERE email=$1 AND is_deleted=false",
      [email]
    );
    if (existingUser.rows.length) {
      const users_idx = existingUser.rows[0].idx;
      await db.query(
        "INSERT INTO users.oauth (users_idx, provider, provider_user_id, refresh_token) VALUES ($1, $2, $3, $4)",
        [users_idx, "kakao", provider_user_id, refreshToken]
      );
      session.userIdx = existingUser.rows[0].idx;
      session.nickname = existingUser.rows[0].nickname;
      return { user: existingUser.rows[0], additional: false };
    } else {
      session.oauth = {
        provider: "kakao",
        provider_user_id,
        email,
        refreshToken,
      };
      throw customError("추가 회원정보 입력 필요", 403);
    }
  }
};

const status = async ({ session }) => {
  if (!session || !session.userIdx) throw customError("로그인 필요", 401);
  return { userIdx: session.userIdx, nickname: session.nickname };
};

module.exports = {
  signin,
  signout,
  signup,
  oauthSignup,
  findId,
  findPw,
  resetPw,
  verifyEmail,
  verifyEmailConfirm,
  kakaoAuth,
  kakaoRedirect,
  status,
};
