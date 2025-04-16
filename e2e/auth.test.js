const request = require("supertest");
const nock = require("nock");
require("dotenv").config();
const app = require("../server");
const pool = require("../database/db");
const service = require("../domains/auth/service");
const algorithm = require("../utils/algorithm");

afterEach(async () => {
  const client = await pool.connect();
  await client.query("DELETE FROM users.codes");
  await client.query("DELETE FROM users.local_tokens");
  await client.query("DELETE FROM users.lists");
  // await client.query("DELETE FROM users.oauth");
  client.release();
});

afterAll(async () => {
  await pool.end();
});

describe("POST /verify-email", () => {
  const agent = request(app);
  it("이메일이 유효하면 상태코드 200를 응답해야한다.", async () => {
    const res = await agent.post("/auth/verify-email").send({ email: "bluegyufordev@gmail.com" });

    const cookie = res.headers["set-cookie"].find((cookie) => cookie.startsWith("email="));
    expect(cookie).toBeDefined();
    expect(res.status).toBe(200);
  });

  it("이메일이 유효하지 않는 경우 상태코드 400을 응답해야한다.", async () => {
    const res = await agent.post("/auth/verify-email").send({ email: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("email");
  });

  it("이미 회원가입된 이메일인 경우 상태코드 409를 응답해야한다.", async () => {
    // 임의로 회원가입 시키기
    const email = "bluegyufordev@gmail.com";

    // 임의로 회원가입 시키기
    const client = await pool.connect();
    await service.createUserAtDb(client, "test", "test", "test", email, null);
    client.release();

    const res = await agent.post("/auth/verify-email").send({ email });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("이미 회원가입에 사용된 이메일입니다.");
  });
});

describe("POST /verify-email/confirm", () => {
  const agent = request(app);
  it("유효한 인증번호를 전송한 경우 상태코드 200을 응답해야한다.", async () => {
    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const responseSendEmailCookies = responseSendEmail.headers["set-cookie"];
    expect(responseSendEmailCookies).toBeDefined();

    const client = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client, email);
    client.release();

    const res = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", responseSendEmailCookies.join("; "))
      .send({ code });

    const cookie = res.headers["set-cookie"].find((cookie) => cookie.startsWith("emailVerified="));
    expect(cookie).toBeDefined();

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
  });

  it("인증번호를 입력하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const responseSendEmailCookies = responseSendEmail.headers["set-cookie"];
    expect(responseSendEmailCookies).toBeDefined();

    const res = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", responseSendEmailCookies.join("; "));

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("code");
  });

  it("인가되지 않은 요청은 상태코드 401을 응답해야한다.", (done) => {
    agent.post("/auth/verify-email/confirm").send({ code: "123456" }).expect(401, done);
  });

  it("인증번호 전송 내역이 없으면 상태코드 404를 응답해야한다.", async () => {
    const responseEmail = await agent
      .post("/auth/verify-email")
      .send({ email: "bluegyufordev@gmail.com" });

    const cookies = responseEmail.headers["set-cookie"];
    const res = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", cookies.join("; "))
      .send({ code: "123456" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("인증번호 전송내역 없음");
  });
});

describe("POST /signup", () => {
  const agent = request(app);
  it("회원가입에 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const sendEmailCookies = responseSendEmail.headers["set-cookie"].join("; ");
    expect(sendEmailCookies).toBeDefined();

    const client = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client, email);
    client.release();

    const responseVerifyCode = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", sendEmailCookies)
      .send({ code });
    const verifyCodeCookies = responseVerifyCode.headers["set-cookie"].join("; ");
    expect(verifyCodeCookies).toBeDefined();

    const res = await agent
      .post("/auth/signup")
      .set("Cookie", verifyCodeCookies)
      .send({ id: "test", pw: "Test!1@2", nickname: "test", code });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("회원가입 성공");
  });

  it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const sendEmailCookies = responseSendEmail.headers["set-cookie"].join("; ");
    expect(sendEmailCookies).toBeDefined();

    const client = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client, email);
    client.release();

    const responseVerifyCode = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", sendEmailCookies)
      .send({ code });
    const verifyCodeCookies = responseVerifyCode.headers["set-cookie"].join("; ");
    expect(verifyCodeCookies).toBeDefined();

    const res = await agent
      .post("/auth/signup")
      .set("Cookie", verifyCodeCookies)
      .send({ id: "test", pw: "", nickname: "test", code });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("pw");
  });

  it("토큰이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const sendEmailCookies = responseSendEmail.headers["set-cookie"].join("; ");
    expect(sendEmailCookies).toBeDefined();

    const client = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client, email);
    client.release();

    const res = await agent
      .post("/auth/signup")
      .send({ id: "test", pw: "Test!1@2", nickname: "test", code });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("토큰 없음");
  });

  it("인증번호가 없는 경우 상태코드 404를 응답해야한다.", async () => {
    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const sendEmailCookies = responseSendEmail.headers["set-cookie"].join("; ");
    expect(sendEmailCookies).toBeDefined();

    const client = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client, email);
    client.release();

    const responseVerifyCode = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", sendEmailCookies)
      .send({ code });
    const verifyCodeCookies = responseVerifyCode.headers["set-cookie"].join("; ");
    expect(verifyCodeCookies).toBeDefined();

    const res = await agent
      .post("/auth/signup")
      .set("Cookie", verifyCodeCookies)
      .send({ id: "test", pw: "Test!1@2", nickname: "test", code: "123456" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("인증번호 전송내역 없음");
  });

  it("중복된 아이디를 가진 회원이 있는 경우 상태코드 409를 응답해야한다.", async () => {
    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const sendEmailCookies = responseSendEmail.headers["set-cookie"].join("; ");
    expect(sendEmailCookies).toBeDefined();

    const client1 = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client1, email);
    client1.release();

    const responseVerifyCode = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", sendEmailCookies)
      .send({ code });
    const verifyCodeCookies = responseVerifyCode.headers["set-cookie"].join("; ");
    expect(verifyCodeCookies).toBeDefined();

    const client2 = await pool.connect();
    await service.createUserAtDb(client2, "test", "Test!1@2", "test1", "test@test.com", null);
    client2.release();

    const res = await agent
      .post("/auth/signup")
      .set("Cookie", verifyCodeCookies)
      .send({ id: "test", pw: "Test!1@2", nickname: "test", code });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 아이디 회원 있음");
    expect(res.body.target).toBe("id");
  });

  it("중복된 닉네임을 가진 회원이 있는 경우 상태코드 409를 응답해야한다.", async () => {
    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const sendEmailCookies = responseSendEmail.headers["set-cookie"].join("; ");
    expect(sendEmailCookies).toBeDefined();

    const client1 = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client1, email);
    client1.release();

    const responseVerifyCode = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", sendEmailCookies)
      .send({ code });
    const verifyCodeCookies = responseVerifyCode.headers["set-cookie"].join("; ");
    expect(verifyCodeCookies).toBeDefined();

    const client2 = await pool.connect();
    await service.createUserAtDb(client2, "test1", "Test!1@2", "same", "test@test.com", null);
    client2.release();

    const res = await agent
      .post("/auth/signup")
      .set("Cookie", verifyCodeCookies)
      .send({ id: "test", pw: "Test!1@2", nickname: "same", code });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 닉네임 회원 있음");
    expect(res.body.target).toBe("nickname");
  });

  it("중복된 이메일을 가진 회원이 있는 경우 상태코드 409를 응답해야한다.", async () => {
    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const sendEmailCookies = responseSendEmail.headers["set-cookie"].join("; ");
    expect(sendEmailCookies).toBeDefined();

    const client1 = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client1, email);
    client1.release();

    const responseVerifyCode = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", sendEmailCookies)
      .send({ code });
    const verifyCodeCookies = responseVerifyCode.headers["set-cookie"].join("; ");
    expect(verifyCodeCookies).toBeDefined();

    const client2 = await pool.connect();
    await service.createUserAtDb(client2, "test1", "Test!1@2", "test1", email, null);
    client2.release();

    const res = await agent
      .post("/auth/signup")
      .set("Cookie", verifyCodeCookies)
      .send({ id: "test", pw: "Test!1@2", nickname: "test", code });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 이메일 회원 있음");
    expect(res.body.target).toBe("email");
  });
});

describe("POST /signin", () => {
  const agent = request(app);
  it("로그인 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const client = await pool.connect();
    await service.createUserAtDb(client, "test", "Test!1@2", "test", "test@test.com", null);
    client.release();

    const res = await agent.post("/auth/signin").send({ id: "test", pw: "Test!1@2" });

    const cookies = res.headers["set-cookie"];
    const hasAccessTokenCookie = cookies.find((cookie) => cookie.startsWith("accessToken="));
    expect(hasAccessTokenCookie).toBeDefined();

    const hasRefreshTokenCookie = cookies.find((cookie) => cookie.startsWith("refreshToken="));
    expect(hasRefreshTokenCookie).toBeDefined();

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
  });

  it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const res = await agent.post("/auth/signin").send({ id: "", pw: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("id");
  });

  it("회원이 아닌 경우 상태코드 404를 응답해야한다.", async () => {
    const res = await agent.post("/auth/signin").send({ id: "test", pw: "Test!1@2" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("계정 없음");
  });
});

describe("POST /findid", () => {
  const agent = request(app);
  it("아이디 찾기 성공한 경우 상태코드 200과 아이디를 응답해야한다.", async () => {
    const id = "test";
    const email = "test@test.com";

    const client = await pool.connect();
    await service.createUserAtDb(client, id, "Test!1@2", "test", email, null);
    client.release();

    const res = await agent.post("/auth/findid").send({ email });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("아이디 조회 성공");
    expect(res.body.id).toBe(id);
  });

  it("이메일을 입력하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const res = await agent.post("/auth/findid").send();

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("email");
  });

  it("아이디 찾기 결과 없는 경우 상태코드 404를 응답해야한다.", (done) => {
    agent.post("/auth/findid").send({ email: "test@test.com" }).expect(404, done);
  });
});

describe("POST /findpw", () => {
  const agent = request(app);
  it("비밀번호 찾기 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const id = "test";
    const email = "test@test.com";
    const client = await pool.connect();
    await service.createUserAtDb(client, id, "Test!1@2", "test", email, null);
    client.release();

    const res = await agent.post("/auth/findpw").send({ id, email });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");

    const cookie = res.headers["set-cookie"].find((cookie) => cookie.startsWith("resetPw="));
    expect(cookie).toBeDefined();
  });

  it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const res = await agent.post("/auth/findpw").send({ id: "", email: "test@test.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("id");
  });

  it("비밀번호 찾기 결과 없는 경우 상태코드 404를 응답해야한다.", (done) => {
    agent.post("/auth/findpw").send({ id: "test", email: "test@test.com" }).expect(404, done);
  });
});

describe("PUT /resetpw", () => {
  const agent = request(app);
  it("비밀번호 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const id = "test";
    const email = "test@test.com";
    const client = await pool.connect();
    await service.createUserAtDb(client, id, "Test!1@2", "test", email, null);
    client.release();

    const responseFindPw = await agent.post("/auth/findpw").send({ id, email });
    const findpwCookie = responseFindPw.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("resetPw=")
    );
    expect(findpwCookie).toBeDefined();

    const res = await agent
      .put("/auth/resetpw")
      .set("Cookie", findpwCookie)
      .send({ pw: "Abcd!1@2" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");

    const cookie = res.headers["set-cookie"].find((cookie) => cookie.startsWith("resetPw="));
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(/resetPw=;/);
  });

  it("비밀번호를 입력하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const id = "test";
    const email = "test@test.com";
    const client = await pool.connect();
    await service.createUserAtDb(client, id, "Test!1@2", "test", email, null);
    client.release();

    const responseFindPw = await agent.post("/auth/findpw").send({ id, email });
    const findpwCookie = responseFindPw.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("resetPw=")
    );
    expect(findpwCookie).toBeDefined();

    const res = await agent.put("/auth/resetpw").set("Cookie", findpwCookie).send();

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("pw");
  });

  it("인증정보가 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const res = await agent.put("/auth/resetpw").send({ pw: "Abcd!1@2" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("토큰 없음");
  });

  it("비밀번호 변경 회원 없는 경우 상태코드 404를 응답해야한다.", async () => {
    const id = "test";
    const email = "test@test.com";
    const client1 = await pool.connect();
    await service.createUserAtDb(client1, id, "Test!1@2", "test", email, null);
    client1.release();

    const responseFindPw = await agent.post("/auth/findpw").send({ id, email });
    const findpwCookie = responseFindPw.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("resetPw=")
    );
    expect(findpwCookie).toBeDefined();

    const client2 = await pool.connect();
    client2.query(`DELETE FROM users.lists`);
    client2.release();

    const res = await agent
      .put("/auth/resetpw")
      .set("Cookie", findpwCookie)
      .send({ pw: "Abcd!1@2" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("계정 없음");
  });
});

describe("GET /auth/oauth/kakao", () => {
  it("카카오 로그인 페이지로 리다이렉트를 해야한다.", (done) => {
    process.env.KAKAO_REST_API_KEY = "some_key";
    process.env.KAKAO_REDIRECT_URI = "some_uri";

    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_REST_API_KEY}&redirect_uri=${process.env.KAKAO_REDIRECT_URI}&response_type=code`;

    request(app).get("/auth/oauth/kakao").expect("Location", url).expect(302, done);
  });
});

describe("GET /auth/oauth/kakao/redirect", () => {
  const agent = request(app);
  it("카카오 로그인 성공한 신규 회원인 경우 회원가입 페이지로 리다이렉트를 해야한다.", async () => {
    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    const res = await agent.get("/auth/oauth/kakao/redirect?code=code");

    const cookie = res.headers["set-cookie"].find((cookie) => cookie.startsWith("oauthIdx="));
    expect(cookie).toBeDefined();

    expect(res.status).toBe(302);
    expect(res.headers["location"]).toContain("/signup");
  });

  it("카카오 로그인에 성공한 기존 회원인 경우 음식점 추천 페이지로 리다이렉트를 해야한다.", async () => {
    const client = await pool.connect();
    const oauth_idx = await service.saveOauthInfoAtDb(
      client,
      "encrypted_access_token",
      "enchrypted_refresh_token",
      Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      1,
      "KAKAO"
    );
    await service.createUserAtDb(client, null, null, "test", "test@test.com", oauth_idx);
    client.release();

    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    const res = await agent.get("/auth/oauth/kakao/redirect?code=code");

    const cookie = res.headers["set-cookie"].find((cookie) => cookie.startsWith("accessToken="));
    expect(cookie).toBeDefined();

    expect(res.status).toBe(302);
    expect(res.headers["location"]).toBe("http://localhost:3000/");
  });

  it("카카오 로그인에 실패한 경우 상태코드 400을 응답해야한다.", (done) => {
    agent.get("/auth/oauth/kakao/redirect").expect(400, done);
  });
});

describe("POST /auth/oauth/signup", () => {
  const agent = request(app);
  it("회원가입 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    const responseToken = await agent.get("/auth/oauth/kakao/redirect?code=code");
    const oauthIdxCookie = responseToken.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("oauthIdx=")
    );

    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const responseSendEmailCookies = responseSendEmail.headers["set-cookie"];

    const client = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client, email);
    client.release();

    const reseponseVerifyCode = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", responseSendEmailCookies.join("; "))
      .send({ code });

    const emailVerifiedCookie = reseponseVerifyCode.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("emailVerified=")
    );

    const res = await agent
      .post("/auth/oauth/signup")
      .set("Cookie", `${oauthIdxCookie}; ${emailVerifiedCookie}`)
      .send({ nickname: "test", code });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
  });

  it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    const responseToken = await agent.get("/auth/oauth/kakao/redirect?code=code");
    const oauthIdxCookie = responseToken.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("oauthIdx=")
    );

    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const responseSendEmailCookies = responseSendEmail.headers["set-cookie"];

    const client = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client, email);
    client.release();

    const reseponseVerifyCode = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", responseSendEmailCookies.join("; "))
      .send({ code });

    const emailVerifiedCookie = reseponseVerifyCode.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("emailVerified=")
    );

    const res = await agent
      .post("/auth/oauth/signup")
      .set("Cookie", `${oauthIdxCookie}; ${emailVerifiedCookie}`)
      .send({ nickname: "test" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("code");
  });

  it("인증정보가 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const res = await agent.post("/auth/oauth/signup").send({ nickname: "test", code: "123456" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("토큰 없음");
  });

  it("이메일 인증번호가 없으면 상태코드 404를 응답해야한다.", async () => {
    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    const responseToken = await agent.get("/auth/oauth/kakao/redirect?code=code");
    const oauthIdxCookie = responseToken.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("oauthIdx=")
    );

    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const responseSendEmailCookies = responseSendEmail.headers["set-cookie"];

    const client = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client, email);
    client.release();

    const reseponseVerifyCode = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", responseSendEmailCookies.join("; "))
      .send({ code });

    const emailVerifiedCookie = reseponseVerifyCode.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("emailVerified=")
    );

    const res = await agent
      .post("/auth/oauth/signup")
      .set("Cookie", `${oauthIdxCookie}; ${emailVerifiedCookie}`)
      .send({ nickname: "test", code: "123456" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("인증번호 전송내역 없음");
  });

  it("중복 이메일 회원이 있는 경우 상태코드 409를 응답해야한다.", async () => {
    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    const responseToken = await agent.get("/auth/oauth/kakao/redirect?code=code");
    const oauthIdxCookie = responseToken.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("oauthIdx=")
    );

    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const responseSendEmailCookies = responseSendEmail.headers["set-cookie"];

    const client1 = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client1, email);
    client1.release();

    const reseponseVerifyCode = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", responseSendEmailCookies.join("; "))
      .send({ code });

    const emailVerifiedCookie = reseponseVerifyCode.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("emailVerified=")
    );

    const client2 = await pool.connect();
    await service.createUserAtDb(client2, null, null, "test1", email, null);
    client2.release();

    const res = await agent
      .post("/auth/oauth/signup")
      .set("Cookie", `${oauthIdxCookie}; ${emailVerifiedCookie}`)
      .send({ nickname: "test", code });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 이메일 회원 있음");
    expect(res.body.target).toBe("email");
  });

  it("중복 닉네임 회원이 있는 경우 상태코드 409를 응답해야한다.", async () => {
    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    const responseToken = await agent.get("/auth/oauth/kakao/redirect?code=code");
    const oauthIdxCookie = responseToken.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("oauthIdx=")
    );

    const email = "bluegyufordev@gmail.com";
    const responseSendEmail = await agent.post("/auth/verify-email").send({ email });
    const responseSendEmailCookies = responseSendEmail.headers["set-cookie"];

    const client1 = await pool.connect();
    const code = await service.getVerifyCodeFromDb(client1, email);
    client1.release();

    const reseponseVerifyCode = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", responseSendEmailCookies.join("; "))
      .send({ code });

    const emailVerifiedCookie = reseponseVerifyCode.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("emailVerified=")
    );

    const client2 = await pool.connect();
    await service.createUserAtDb(client2, null, null, "test", "test@test.com", null);
    client2.release();

    const res = await agent
      .post("/auth/oauth/signup")
      .set("Cookie", `${oauthIdxCookie}; ${emailVerifiedCookie}`)
      .send({ nickname: "test", code });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 닉네임 회원 있음");
    expect(res.body.target).toBe("nickname");
  });
});

describe("DELETE /signout", () => {
  const agent = request(app);
  it("로컬 로그인한 회원이 로그아웃 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const client = await pool.connect();
    await service.createUserAtDb(client, "test", "Test!1@2", "test", "test@test.com", null);
    client.release();

    const responseSignin = await agent.post("/auth/signin").send({ id: "test", pw: "Test!1@2" });
    const cookie = responseSignin.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("accessToken=")
    );
    expect(cookie).toBeDefined();

    const res = await agent.delete("/auth/signout").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
    console.log(res.headers["set-cookie"]);
    const resCookie = res.headers["set-cookie"].find((cookie) => cookie.startsWith("accessToken="));
    expect(resCookie).toBeDefined();
    expect(resCookie).toMatch(/accessToken=;/);
  });

  it("카카오 로그인한 회원이 로그아웃 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const client = await pool.connect();
    const oauth_idx = await service.saveOauthInfoAtDb(
      client,
      "encrypted_access_token",
      "enchrypted_refresh_token",
      Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      1,
      "KAKAO"
    );
    await service.createUserAtDb(client, null, null, "test", "test@test.com", oauth_idx);
    client.release();

    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    nock("https://kapi.kakao.com").post("/v1/user/logout").reply(200);

    const responseOauthSignIn = await agent.get("/auth/oauth/kakao/redirect?code=code");
    const tokenCookie = responseOauthSignIn.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("accessToken=")
    );

    jest.spyOn(algorithm, "decrypt").mockResolvedValue();

    const res = await agent.delete("/auth/signout").set("Cookie", tokenCookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");

    const resCookie = res.headers["set-cookie"].find((cookie) => cookie.startsWith("accessToken="));
    expect(resCookie).toBeDefined();
    expect(resCookie).toMatch(/accessToken=;/);
  });

  it("로그인이 되어있지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const res = await agent.delete("/auth/signout");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("토큰 없음");
  });
});
