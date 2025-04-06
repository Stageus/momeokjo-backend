const { transporter } = require("../../utils/nodemailer");
const axios = require("axios");

exports.createUserAtDb = async (client, id, pw, nickname, email) => {
  await client.query(
    "INSERT INTO users.lists (id, pw, nickname, email, role) VALUES ($1, $2, $3, $4, $5)",
    [id, pw, nickname, email, "USER"]
  );
};

exports.getUserIdFromDb = async (client, email) => {
  const results = await client.query(
    `
      SELECT id
      FROM users.lists
      WHERE email = $1
      AND is_deleted = false;
    `,
    [email]
  );

  return results.rows[0].id;
};

exports.checkIsExistedEmailFromDb = async (client, email) => {
  const results = await client.query(
    `
      SELECT
        CASE 
          WHEN email = $1 THEN true 
          ELSE false
        END AS isExistedEmail
      FROM users.lists
      WHERE email = $1
    `,
    [email]
  );

  return results.rows[0].isExistedEmail;
};

exports.createVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.saveVerificationCodeAtDb = async (client, email, code) => {
  await client.query(
    `
        INSERT INTO users.codes(
        email,
        code
      ) VALUES (
       $1, $2
      )
    `,
    [email, code]
  );
};

exports.sendEmailVerificationCode = async (email, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "이메일 인증 코드",
    text: `인증번호: ${code}`,
  });
};

exports.checkVerificationCodeAtDb = async (client, email, code) => {
  const results = await client.query(
    `
      SELECT
        CASE 
          WHEN code = $1 THEN true 
          ELSE false
        END AS isValidCode
      FROM users.codes
      WHERE email = $2
    `,
    [code, email]
  );

  return results.rows[0].isValidCode;
};

// 카카오에 토큰 발급 요청
exports.getKakaoToken = async (code) => {
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

  return {
    accessToken: tokenResponse.data.access_token,
    refreshToken: tokenResponse.data.refresh_token,
  };
};

// 카카오에 사용자 정보 요청
exports.getKakaoUserInfo = async (accessToken) => {
  const response = await axios("https://kapi.kakao.com/v2/user/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return { provider_user_id: response.data.id };
};

// 사용자 회원가입 이력 확인
exports.checkOauthUser = async (client, provider_user_id) => {
  const results = await client.query(
    `
      SELECT
        CASE
          WHEN COUNT(*) > 0 THEN true
          ELSE false
        END AS isExistedOauthUser,
        user_idx
      FROM users.oauth
      WHERE provider_user_id = $1
      AND is_deleted = false
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    [provider_user_id]
  );

  return {
    isExistedOauthUser: results.rows[0].isExistedOauthUser,
    users_idx: results.rows[0].users_idx,
  };
};

// oauth 인증정보 데이터베이스에 저장
exports.saveOauthInfoAtDb = async (
  client,
  encryptedAccessToken,
  encryptedRefreshToken,
  provider_user_id
) => {
  const results = client.query(
    `
        INSERT INTO users.oauth (
          provider,
          provider_user_id,
          refresh_token,
          access_token
        ) VALUES (
          'KAKAO',
          $1,
          $2,
          $3
        )
        RETURNING idx AS oauth_idx;
      `,
    [provider_user_id, encryptedRefreshToken, encryptedAccessToken]
  );

  return results.rows[0].oauth_idx;
};

// 카카오 로그인 - 대기
exports.redirectToOauthProvider = async () => {
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
