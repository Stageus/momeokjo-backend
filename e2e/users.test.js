const request = require("supertest");
const app = require("../server");
const pool = require("../database/db");
const helper = require("./helpers/setupForTest");

afterEach(async () => {
  const client = await pool.connect();
  await client.query("DELETE FROM reviews.lists");
  await client.query("DELETE FROM menus.lists");
  await client.query("DELETE FROM restaurants.lists");
  await client.query("DELETE FROM restaurants.categories");
  await client.query("DELETE FROM users.local_tokens");
  await client.query("DELETE FROM users.lists");
  client.release();
});

afterAll(async () => {
  await pool.end();
});

describe("PUT /", () => {
  const agent = request(app);
  it("내 정보 수정에 성공하면 상태코드 200을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      oauth_idx: null,
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

    const res = await agent.put("/users").set("Cookie", cookie).send({ nickname: "test1" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
  });

  it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      oauth_idx: null,
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

    const res = await agent.put("/users").set("Cookie", cookie).send({ nickname: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("nickname");
  });

  it("인증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      oauth_idx: null,
    });

    const res = await agent.put("/users").send({ nickname: "test1" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("토큰 없음");
  });

  it("수정 대상 없는 경우 상태코드 404를 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      oauth_idx: null,
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

    const client = await pool.connect();
    await client.query(`DELETE FROM users.local_tokens`);
    await client.query(`DELETE FROM users.lists`);
    client.release();

    const res = await agent.put("/users").set("Cookie", cookie).send({ nickname: "test1" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("수정 대상 없음");
  });

  it("중복 닉네임이 있는 경우 상태코드 409를 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      oauth_idx: null,
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

    await helper.createTempUserReturnIdx({
      id: "test1",
      pw: "Test!1@2",
      nickname: "test1",
      email: "test1@test.com",
      role: "USER",
      oauth_idx: null,
    });

    const res = await agent.put("/users").set("Cookie", cookie).send({ nickname: "test1" });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 닉네임 회원 있음");
  });
});

describe("GET /:user_idx", () => {
  const agent = request(app);
  it("사용자 정보 조회 성공한 경우 상태코드 200과 사용자 정보를 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    const users_idx = await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      oauth_idx: null,
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

    const res = await agent.get(`/users/${users_idx}`).set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
    expect(res.body.data).toStrictEqual(expect.any(Object));
  });

  it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", (done) => {
    agent.get(`/users/asdfasdf`).expect(400, done);
  });

  it("사용자가 없는 경우 상태코드 404를 응답해야한다.", (done) => {
    agent.get("/users/1").expect(404, done);
  });
});
