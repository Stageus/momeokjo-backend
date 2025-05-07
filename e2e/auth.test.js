require("dotenv").config();

const request = require("supertest");
const nock = require("nock");
const {
  initializeDatabase,
  clearDatabase,
  disconnectDatabse,
} = require("../e2e/helpers/setupDatabase");

const app = require("../server");
const service = require("../domains/auth/service");
const algorithm = require("../utils/algorithm");
const COOKIE_NAME = require("../utils/cookieName");
const helper = require("./helpers/setupForTest");

let pool;
beforeAll(async () => {
  pool = await initializeDatabase();
});

afterAll(async () => {
  await disconnectDatabse();
});

describe("POST /auth/verify-email", () => {
  afterEach(async () => {
    await clearDatabase();
  });
  const agent = request(app);
  it("이메일이 유효하면 상태코드 200를 응답해야한다.", async () => {
    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const res = await agent.post("/auth/verify-email").send({ email: "test@gtest.com" });

    const cookie = res.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );
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
    await helper.createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      pool,
    });

    const res = await agent.post("/auth/verify-email").send({ email: "test@test.com" });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 이메일 회원 있음");
  });
});

describe("POST /verify-email/confirm", () => {
  afterEach(async () => {
    await clearDatabase();
  });
  const agent = request(app);
  it("유효한 인증번호를 전송한 경우 상태코드 200을 응답해야한다.", async () => {
    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const code = await helper.getTempCodeFromDb({ email, pool });
    const res = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code });

    const cookie = res.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_VERIFIED}=`)
    );
    expect(cookie).toBeDefined();

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
  });

  it("인증번호를 입력하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const res = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("code");
  });

  it("인증번호 전송 내역이 없으면 상태코드 400을 응답해야한다.", async () => {
    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const resEmail = await agent.post("/auth/verify-email").send({ email: "test@test.com" });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const res = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("code");
  });

  it("인가되지 않은 요청은 상태코드 401을 응답해야한다.", async () => {
    const res = await agent.post("/auth/verify-email/confirm").send({ code: "123456" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("인증번호 이메일 전송되지 않음");
  });
});

describe("POST /signup", () => {
  afterEach(async () => {
    await clearDatabase();
  });
  const agent = request(app);
  it("회원가입에 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const code = await helper.getTempCodeFromDb({ email, pool });

    const resVerify = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code });
    const resVerifyCookie = resVerify.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_VERIFIED}=`)
    );

    const res = await agent
      .post("/auth/signup")
      .set("Cookie", resVerifyCookie)
      .send({ id: "test", pw: "Test!1@2", nickname: "test" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("회원가입 성공");
  });

  it("id 입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const code = await helper.getTempCodeFromDb({ email, pool });

    const resVerify = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code });
    const resVerifyCookie = resVerify.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_VERIFIED}=`)
    );

    const res = await agent
      .post("/auth/signup")
      .set("Cookie", resVerifyCookie)
      .send({ id: "", pw: "Test!1@2", nickname: "test" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("id");
  });

  it("nickname 입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const code = await helper.getTempCodeFromDb({ email, pool });

    const resVerify = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code });
    const resVerifyCookie = resVerify.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_VERIFIED}=`)
    );

    const res = await agent
      .post("/auth/signup")
      .set("Cookie", resVerifyCookie)
      .send({ id: "test", pw: "Test!1@2", nickname: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("nickname");
  });

  it("이메일 인증이 되지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const res = await agent
      .post("/auth/signup")
      .send({ id: "test", pw: "Test!1@2", nickname: "test", code: "123456" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("이메일 인증되지 않음");
  });

  it("중복된 아이디를 가진 회원이 있는 경우 상태코드 409를 응답해야한다.", async () => {
    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const code = await helper.getTempCodeFromDb({ email, pool });

    const resVerify = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code });
    const resVerifyCookie = resVerify.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_VERIFIED}=`)
    );

    await helper.createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test1",
      email: "test1@test.com",
      role: "USER",
      pool,
    });

    const res = await agent
      .post("/auth/signup")
      .set("Cookie", resVerifyCookie)
      .send({ id: "test", pw: "Test!1@2", nickname: "test" });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 아이디 회원 있음");
    expect(res.body.target).toBe("id");
  });

  it("중복된 닉네임을 가진 회원이 있는 경우 상태코드 409를 응답해야한다.", async () => {
    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const code = await helper.getTempCodeFromDb({ email, pool });

    const resVerify = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code });
    const resVerifyCookie = resVerify.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_VERIFIED}=`)
    );

    await helper.createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test",
      email: "test1@test.com",
      role: "USER",
      pool,
    });

    const res = await agent
      .post("/auth/signup")
      .set("Cookie", resVerifyCookie)
      .send({ id: "test1", pw: "Test!1@2", nickname: "test" });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 닉네임 회원 있음");
    expect(res.body.target).toBe("nickname");
  });

  it("중복된 이메일을 가진 회원이 있는 경우 상태코드 409를 응답해야한다.", async () => {
    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const code = await helper.getTempCodeFromDb({ email, pool });

    const resVerify = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code });
    const resVerifyCookie = resVerify.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_VERIFIED}=`)
    );

    await helper.createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      pool,
    });

    const res = await agent
      .post("/auth/signup")
      .set("Cookie", resVerifyCookie)
      .send({ id: "test1", pw: "Test!1@2", nickname: "test1" });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 이메일 회원 있음");
    expect(res.body.target).toBe("email");
  });
});

describe("POST /signin", () => {
  afterEach(async () => {
    await clearDatabase();
  });
  const agent = request(app);
  it("로그인 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      pool,
    });

    const res = await agent.post("/auth/signin").send({ id, pw });
    const cookie = res.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.ACCESS_TOKEN}=`)
    );
    expect(cookie).toBeDefined();

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
  });

  it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const res = await agent.post("/auth/signin").send({ id: "", pw: "Test!1@2" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("id");
  });

  it("회원이 없는 경우 상태코드 404를 응답해야한다.", async () => {
    const res = await agent.post("/auth/signin").send({ id: "test", pw: "Test!1@2" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("등록된 계정 없음");
  });
});

describe("POST /findid", () => {
  afterEach(async () => {
    await clearDatabase();
  });
  const agent = request(app);
  it("아이디 찾기 성공한 경우 상태코드 200과 아이디를 응답해야한다.", async () => {
    const id = "test";
    const email = "test@test.com";

    await helper.createTempUserReturnIdx({
      id,
      pw: "Test!1@2",
      nickname: "test",
      email,
      role: "USER",
      pool,
    });

    const res = await agent.post("/auth/findid").send({ email });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
    expect(res.body.data.id).toBe(id);
  });

  it("이메일을 입력하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const res = await agent.post("/auth/findid").send({ email: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("email");
  });

  it("해당하는 사용자 없는 경우 상태코드 404를 응답해야한다.", async () => {
    const res = await agent.post("/auth/findid").send({ email: "test@test.com" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("해당하는 사용자 없음");
  });
});

describe("POST /findpw", () => {
  afterEach(async () => {
    await clearDatabase();
  });
  const agent = request(app);
  it("비밀번호 찾기 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const id = "test";
    const email = "test@test.com";

    await helper.createTempUserReturnIdx({
      id,
      pw: "Test!1@2",
      nickname: "test",
      email,
      role: "USER",
      pool,
    });

    const res = await agent.post("/auth/findpw").send({ id, email });

    const cookie = res.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.PASSWORD_RESET}=`)
    );

    expect(cookie).toBeDefined();

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
  });

  it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const res = await agent.post("/auth/findpw").send({ id: "", email: "test@test.com" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("id");
  });

  it("해당하는 사용자 없는 경우 상태코드 404를 응답해야한다.", async () => {
    const res = await agent.post("/auth/findpw").send({ id: "test", email: "test@test.com" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("해당하는 사용자 없음");
  });
});

describe("PUT /resetpw", () => {
  afterEach(async () => {
    await clearDatabase();
  });
  const agent = request(app);
  it("비밀번호 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const id = "test";
    const email = "test@test.com";
    await helper.createTempUserReturnIdx({
      id,
      pw: "Test!1@2",
      nickname: "test",
      email,
      role: "USER",
      pool,
    });

    const resReset = await agent.post("/auth/findpw").send({ id, email });
    const resResetCookie = resReset.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.PASSWORD_RESET}=`)
    );

    const res = await agent
      .put("/auth/resetpw")
      .set("Cookie", resResetCookie)
      .send({ pw: "Abcd!1@2" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");

    const cookie = res.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.PASSWORD_RESET}=`)
    );
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(new RegExp(`${COOKIE_NAME.PASSWORD_RESET}=;`));
  });

  it("비밀번호를 입력하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const id = "test";
    const email = "test@test.com";
    await helper.createTempUserReturnIdx({
      id,
      pw: "Test!1@2",
      nickname: "test",
      email,
      role: "USER",
      pool,
    });

    const resReset = await agent.post("/auth/findpw").send({ id, email });
    const resResetCookie = resReset.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.PASSWORD_RESET}=`)
    );

    const res = await agent.put("/auth/resetpw").set("Cookie", resResetCookie).send({ pw: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
  });

  it("인증정보가 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const res = await agent.put("/auth/resetpw").send({ pw: "Abcd!1@2" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("비밀번호 변경 인증 정보 없음");
  });

  it("비밀번호 변경 회원 없는 경우 상태코드 404를 응답해야한다.", async () => {
    const id = "test";
    const email = "test@test.com";
    await helper.createTempUserReturnIdx({
      id,
      pw: "Test!1@2",
      nickname: "test",
      email,
      role: "USER",
      pool,
    });

    const resReset = await agent.post("/auth/findpw").send({ id, email });
    const resResetCookie = resReset.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.PASSWORD_RESET}=`)
    );

    const client = await pool.connect();
    await client.query(`DELETE FROM users.lists`);
    client.release();

    const res = await agent
      .put("/auth/resetpw")
      .set("Cookie", resResetCookie)
      .send({ pw: "Abcd!1@2" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("해당하는 사용자 없음");
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
  afterEach(async () => {
    await clearDatabase();
  });
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
    const oauth_idx = await helper.createTempOauthReturnIdx({
      provider: "KAKAO",
      provider_user_id: 1,
      encryptedRefreshToken: "enchrypted_refresh_token",
      encryptedAccessToken: "encrypted_access_token",
      refreshTokenExpiresIn: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      pool,
    });

    helper.createTempUserReturnIdx({
      id: null,
      pw: null,
      email: "test@test.com",
      nickname: "test",
      role: "USER",
      oauth_idx,
      pool,
    });

    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    const res = await agent.get("/auth/oauth/kakao/redirect?code=code");

    const cookie = res.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.ACCESS_TOKEN}=`)
    );
    expect(cookie).toBeDefined();

    expect(res.status).toBe(302);
    expect(res.headers["location"]).toBe("http://localhost:3000/");
  });

  it("카카오 로그인에 실패한 경우 상태코드 400을 응답해야한다.", (done) => {
    agent.get("/auth/oauth/kakao/redirect").expect(400, done);
  });
});

describe("POST /auth/oauth/signup", () => {
  afterEach(async () => {
    await clearDatabase();
  });
  const agent = request(app);
  it("회원가입 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    const resOauth = await agent.get("/auth/oauth/kakao/redirect?code=code");
    const resOauthCookie = resOauth.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.OAUTH_INDEX}=`)
    );

    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const code = await helper.getTempCodeFromDb({ email, pool });

    const resVerify = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code });

    const resVerifyCookie = resVerify.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_VERIFIED}=`)
    );

    const res = await agent
      .post("/auth/oauth/signup")
      .set("Cookie", `${resOauthCookie}; ${resVerifyCookie}`)
      .send({ nickname: "test" });

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

    const resOauth = await agent.get("/auth/oauth/kakao/redirect?code=code");
    const resOauthCookie = resOauth.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.OAUTH_INDEX}=`)
    );

    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const code = await helper.getTempCodeFromDb({ email, pool });

    const resVerify = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code });

    const resVerifyCookie = resVerify.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_VERIFIED}=`)
    );

    const res = await agent
      .post("/auth/oauth/signup")
      .set("Cookie", `${resOauthCookie}; ${resVerifyCookie}`)
      .send({ nickname: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("nickname");
  });

  it("카카오 인증정보가 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const code = await helper.getTempCodeFromDb({ email, pool });

    const resVerify = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code });

    const resVerifyCookie = resVerify.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_VERIFIED}=`)
    );

    const res = await agent
      .post("/auth/oauth/signup")
      .set("Cookie", resVerifyCookie)
      .send({ nickname: "test" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("카카오 인증되지 않음");
  });

  it("이메일 인증정보가 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    const resOauth = await agent.get("/auth/oauth/kakao/redirect?code=code");
    const resOauthCookie = resOauth.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.OAUTH_INDEX}=`)
    );

    const res = await agent
      .post("/auth/oauth/signup")
      .set("Cookie", resOauthCookie)
      .send({ nickname: "test" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("이메일 인증되지 않음");
  });

  it("중복 닉네임 회원이 있는 경우 상태코드 409를 응답해야한다.", async () => {
    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    const resOauth = await agent.get("/auth/oauth/kakao/redirect?code=code");
    const resOauthCookie = resOauth.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.OAUTH_INDEX}=`)
    );

    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const code = await helper.getTempCodeFromDb({ email, pool });

    const resVerify = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code });

    const resVerifyCookie = resVerify.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_VERIFIED}=`)
    );

    helper.createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test",
      email: "test1@test.com",
      role: "USER",
      pool,
    });

    const res = await agent
      .post("/auth/oauth/signup")
      .set("Cookie", `${resOauthCookie}; ${resVerifyCookie}`)
      .send({ nickname: "test" });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 닉네임 회원 있음");
    expect(res.body.target).toBe("nickname");
  });

  it("중복 이메일 회원이 있는 경우 상태코드 409를 응답해야한다.", async () => {
    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    const resOauth = await agent.get("/auth/oauth/kakao/redirect?code=code");
    const resOauthCookie = resOauth.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.OAUTH_INDEX}=`)
    );

    jest.spyOn(service, "sendEmailVerificationCode").mockResolvedValue();

    const email = "test@test.com";
    const resEmail = await agent.post("/auth/verify-email").send({ email });
    const resEmailCookie = resEmail.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_SEND}=`)
    );

    const code = await helper.getTempCodeFromDb({ email, pool });

    const resVerify = await agent
      .post("/auth/verify-email/confirm")
      .set("Cookie", resEmailCookie)
      .send({ code });

    const resVerifyCookie = resVerify.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.EMAIL_AUTH_VERIFIED}=`)
    );

    helper.createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test1",
      email: "test@test.com",
      role: "USER",
      pool,
    });

    const res = await agent
      .post("/auth/oauth/signup")
      .set("Cookie", `${resOauthCookie}; ${resVerifyCookie}`)
      .send({ nickname: "test" });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 이메일 회원 있음");
    expect(res.body.target).toBe("email");
  });
});

describe("DELETE /signout", () => {
  afterEach(async () => {
    await clearDatabase();
  });
  const agent = request(app);
  it("로컬 로그인한 회원이 로그아웃 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    await helper.createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      pool,
    });

    const resSignin = await agent.post("/auth/signin").send({ id: "test", pw: "Test!1@2" });
    const resSigninCookie = resSignin.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.ACCESS_TOKEN}=`)
    );

    const res = await agent.delete("/auth/signout").set("Cookie", resSigninCookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");

    const cookie = res.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.ACCESS_TOKEN}=`)
    );
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(new RegExp(`${COOKIE_NAME.ACCESS_TOKEN}=;`));
  });

  it("카카오 로그인한 회원이 로그아웃 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const oauth_idx = await helper.createTempOauthReturnIdx({
      provider: "KAKAO",
      provider_user_id: 1,
      encryptedAccessToken: "encrypted_access_token",
      encryptedRefreshToken: "enchrypted_refresh_token",
      refreshTokenExpiresIn: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      pool,
    });

    helper.createTempUserReturnIdx({
      id: null,
      pw: null,
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      oauth_idx,
      pool,
    });

    nock("https://kauth.kakao.com").post("/oauth/token").reply(200, {
      access_token: "some_access_token",
      refresh_token: "some_refresh_token",
      refresh_token_expires_in: 123123,
    });

    nock("https://kapi.kakao.com").get("/v2/user/me").reply(200, { id: 1 });

    nock("https://kapi.kakao.com").post("/v1/user/logout").reply(200);

    const resOauth = await agent.get("/auth/oauth/kakao/redirect?code=code");
    const resOauthCookie = resOauth.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.ACCESS_TOKEN}=`)
    );

    jest
      .spyOn(algorithm, "decrypt")
      .mockResolvedValue({ isDecrypted: true, results: "decrypted_access_token" });

    const res = await agent.delete("/auth/signout").set("Cookie", resOauthCookie);
    // console.log(res);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");

    const cookie = res.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.ACCESS_TOKEN}=`)
    );
    expect(cookie).toBeDefined();
    expect(cookie).toMatch(new RegExp(`${COOKIE_NAME.ACCESS_TOKEN}=;`));
  });

  it("로그인이 되어있지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const res = await agent.delete("/auth/signout");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("로그인 필요");
  });
});

describe("GET /status", () => {
  afterEach(async () => {
    await clearDatabase();
  });
  const agent = request(app);
  it("상태조회 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";
    const users_idx = await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      pool,
    });

    const resSignin = await agent.post("/auth/signin").send({ id, pw });
    const resAccessCookie = resSignin.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.ACCESS_TOKEN}=`)
    );
    const resRefreshCookie = resSignin.headers["set-cookie"].find((cookie) =>
      cookie.startsWith(`${COOKIE_NAME.REFRESH_TOKEN}=`)
    );

    const res = await agent.get("/auth/status").set("Cookie", [resRefreshCookie, resAccessCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data.nickname).toBe("test");
    expect(res.body.data.users_idx).toBe(users_idx);
  });

  it("유효하지 않은 인증인 경우 상태코드 401을 응답해야한다.", async () => {
    const res = await agent.get("/auth/status");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("로그인 필요");
  });
});
