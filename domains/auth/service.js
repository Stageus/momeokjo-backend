const { transporter } = require("../../utils/nodemailer");
const axios = require("axios");

exports.checkIsUserFromDb = async (client, id, pw) => {
  const results = await client.query(
    `
      SELECT
        TRUE AS is_user,
        idx
      FROM users.lists
      WHERE id = $1
      AND pw = $2
      AND is_deleted = false;
    `,
    [id, pw]
  );

  return { isUser: results.rows[0]?.is_user || false, users_idx: results.rows[0]?.idx };
};

exports.checkLocalRefreshTokenFromDb = async (client, users_idx) => {
  const results = await client.query(
    `
      SELECT
        refresh_expired_at < NOW() AS is_expired,
        refresh_token
      FROM users.local_tokens
      WHERE users_idx = $1
        AND is_deleted = false
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    [users_idx]
  );

  return {
    isExpired: results.rows[0]?.is_expired || true,
    refreshToken: results.rows[0]?.refresh_token || "",
  };
};

exports.saveNewRefreshTokenAtDb = async (client, users_idx, refreshToken, refresh_expired_at) => {
  await client.query(
    `
    INSERT INTO users.local_tokens (
      users_idx,
      refresh_token,
      refresh_expired_at
   ) VALUES (
      $1,
      $2,
      $3
   );
    `,
    [users_idx, refreshToken, refresh_expired_at]
  );
};

exports.createUserAtDb = async (client, id, pw, nickname, email, oauth_idx) => {
  await client.query(
    "INSERT INTO users.lists (id, pw, nickname, email, role, oauth_idx) VALUES ($1, $2, $3, $4, $5, $6);",
    [id, pw, nickname, email, "USER", oauth_idx]
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

  return { isUser: results.rowCount > 0, id: results.rows[0]?.id };
};

//
exports.checkUserWithIdAndEmailFromDb = async (client, id, email) => {
  const results = await client.query(
    `
    SELECT
      EXISTS (
        SELECT 1
        FROM users.lists
        WHERE id = $1
        AND email = $2
      ) AS is_existed
  `,
    [id, email]
  );

  return results.rows[0].is_existed;
};

exports.updatePasswordAtDb = async (client, id, pw, email) => {
  await client.query(
    `
      UPDATE users.lists SET pw = $2
      WHERE id = $1
      AND email = $3
      AND is_deleted = false;
    `,
    [id, pw, email]
  );
};

exports.checkIsExistedEmailFromDb = async (client, email) => {
  const results = await client.query(
    `
      SELECT
        EXISTS(
          SELECT 1
          FROM users.lists
          WHERE email = $1
          AND is_deleted = false
      ) AS is_exist_email;
    `,
    [email]
  );

  return results.rows[0].is_exist_email;
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

exports.getVerifyCodeFromDb = async (client, email) => {
  const results = await client.query(
    `
      SELECT
        code
      FROM users.codes
      WHERE email = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [email]
  );

  return results.rows[0].code;
};

// 카카오에 토큰 발급 요청
exports.getTokenFromKakao = async (code) => {
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
    refreshTokenExpiresIn: tokenResponse.data.refresh_token_expires_in,
  };
};

// 카카오에 사용자 정보 요청
exports.getProviderIdFromKakao = async (accessToken) => {
  const response = await axios("https://kapi.kakao.com/v2/user/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.data.id;
};

// 사용자 회원가입 이력 확인
exports.checkOauthUserAtDb = async (client, provider_user_id) => {
  const results = await client.query(
    `
      SELECT
        CASE
          WHEN TO_TIMESTAMP(refresh_expires_in) > NOW() THEN true
          ELSE false
        END AS is_existed,
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
    isExisted: results.rows[0].is_existed,
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

exports.invalidateLocalRefreshTokenAtDb = async (client, users_idx) => {
  await client.query(
    `
      UPDATE users.local_tokens SET
        is_deleted = true
      WHERE users_idx = $1
      AND is_deleted = false
    `,
    [users_idx]
  );
};

exports.getOauthIdxFromDb = async (client, users_idx) => {
  const results = await client.query(
    `
      SELECT oauth_idx
      FROM users.lists
      WHERE idx = $1
      AND is_deleted = false;
    `,
    [users_idx]
  );

  return results.rows[0].oauth_idx;
};

exports.invalidateOauthRefreshTokenAtDb = async (client, oauth_idx) => {
  const results = await client.query(
    `
      SELECT
        access_token,
        provider_user_id
      FROM users.oauth
      WHERE idx = $1
      AND is_deleted = false;
    `,
    [oauth_idx]
  );

  return {
    accessToken: results.rows[0].access_token,
    provider_user_id: results.rows[0].provider_user_id,
  };
};

exports.requestKakaoLogout = async (accessToken, provider_user_id) => {
  await axios({
    method: "POST",
    url: "https://kapi.kakao.com/v1/user/logout",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      target_id_type: "user_id",
      target_id: provider_user_id,
    },
  });
};
