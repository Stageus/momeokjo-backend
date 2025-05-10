const { transporter } = require("../../utils/nodemailer");
const axios = require("axios");

exports.checkIsUserFromDb = async ({ client, id, pw }) => {
  const results = await client.query(
    `
      SELECT
        TRUE AS is_user,
        idx,
        role
      FROM users.lists
      WHERE id = $1
      AND pw = $2
      AND is_deleted = false;
    `,
    [id, pw]
  );

  return {
    isUser: results.rows[0]?.is_user ?? false,
    users_idx: results.rows[0]?.idx,
    role: results.rows[0]?.role,
  };
};

exports.checkLocalRefreshTokenFromDb = async ({ client, users_idx }) => {
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
    isExpired: results.rows[0]?.is_expired ?? true,
    refreshToken: results.rows[0]?.refresh_token,
  };
};

exports.createUserAtDb = async ({ client, id, pw, nickname, email, role, oauth_idx = null }) => {
  await client.query(
    "INSERT INTO users.lists (id, pw, nickname, email, role, oauth_idx) VALUES ($1, $2, $3, $4, $5, $6);",
    [id, pw, nickname, email, role, oauth_idx]
  );
};

exports.getUserIdFromDb = async ({ client, email }) => {
  const results = await client.query(
    `
      SELECT 
      TRUE AS is_user,
      id
      FROM users.lists
      WHERE email = $1
      AND is_deleted = false;
    `,
    [email]
  );

  return { isUser: results.rows[0]?.is_user ?? false, id: results.rows[0]?.id };
};

//
exports.checkUserWithIdAndEmailFromDb = async ({ client, id, email }) => {
  const results = await client.query(
    `
    SELECT
      EXISTS (
        SELECT 1
        FROM users.lists
        WHERE id = $1
        AND email = $2
      ) AS is_existed;
  `,
    [id, email]
  );

  return results.rows[0].is_existed;
};

exports.updatePasswordAtDb = async ({ client, id, pw, email }) => {
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

exports.checkIsExistedEmailFromDb = async ({ client, email }) => {
  const results = await client.query(
    `
      SELECT
        EXISTS(
          SELECT 1
          FROM users.lists
          WHERE email = $1
          AND is_deleted = false
      ) AS is_exist;
    `,
    [email]
  );

  return results.rows[0].is_exist;
};

exports.createVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.saveVerificationCodeAtDb = async ({ client, email, code }) => {
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

exports.sendEmailVerificationCode = async ({ email, code }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "이메일 인증 코드",
    text: `인증번호: ${code}`,
  });
};

exports.checkVerifyCodeFromDb = async ({ client, email, code }) => {
  const results = await client.query(
    `
      SELECT
        TRUE AS is_code
      FROM users.codes
      WHERE email = $1
        AND code = $2
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    [email, code]
  );

  return results.rows[0]?.is_code ?? false;
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
exports.checkOauthUserAtDb = async ({ client, provider_user_id, provider }) => {
  const results = await client.query(
    `
      SELECT
        TO_TIMESTAMP(oauth.refresh_expires_in) > NOW() AS is_existed,
        users.idx AS users_idx
      FROM users.oauth oauth
      JOIN users.lists users ON users.oauth_idx = oauth.idx
      WHERE oauth.provider_user_id = $1
      AND oauth.provider = $2
      AND oauth.is_deleted = false
      AND users.is_deleted = false
      ORDER BY oauth.created_at DESC
      LIMIT 1;
    `,
    [provider_user_id, provider]
  );

  return {
    isExisted: results.rows[0]?.is_existed ?? false,
    users_idx: results.rows[0]?.users_idx,
  };
};

// oauth 인증정보 데이터베이스에 저장
exports.saveOauthInfoAtDb = async ({
  client,
  accessToken,
  refreshToken,
  refreshTokenExpiresIn,
  provider_user_id,
  provider,
}) => {
  const results = await client.query(
    `
        INSERT INTO users.oauth (
          provider,
          provider_user_id,
          refresh_token,
          access_token,
          refresh_expires_in
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        RETURNING idx AS oauth_idx;
      `,
    [provider, provider_user_id, refreshToken, accessToken, refreshTokenExpiresIn]
  );

  return results.rows[0].oauth_idx;
};

exports.getOauthAccessTokenFromDb = async ({ client, users_idx }) => {
  const results = await client.query(
    `
      SELECT
        access_token,
        provider_user_id
      FROM users.oauth
      WHERE idx = (
        SELECT oauth_idx
        FROM users.lists
        WHERE idx = $1
          AND is_deleted = false
      )
      AND is_deleted = false;
    `,
    [users_idx]
  );

  return {
    accessToken: results.rows[0].access_token,
    provider_user_id: results.rows[0].provider_user_id,
  };
};

exports.requestKakaoLogout = async ({ accessToken, provider_user_id }) => {
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

exports.getUserNicknameFromDb = async ({ client, users_idx }) => {
  const results = await client.query(
    `
      SELECT
        nickname
      FROM users.lists
      WHERE idx = $1
        AND is_deleted = false;
    `,
    [users_idx]
  );

  return results.rows[0].nickname;
};
