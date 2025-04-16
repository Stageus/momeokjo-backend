const request = require("supertest");
const app = require("../server");
const pool = require("../database/db");
const authService = require("../domains/auth/service");

afterEach(async () => {
  const client = await pool.connect();
  await client.query("DELETE FROM restaurants.categories");
  await client.query("DELETE FROM restaurants.lists");
  await client.query("DELETE FROM users.local_tokens");
  await client.query("DELETE FROM users.lists");
  client.release();
});

afterAll(async () => {
  await pool.end();
});

describe("POST /categories", () => {
  const agent = request(app);
  it("카테고리 등록 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const client = await pool.connect();
    authService.createUserAtDb(client, "test", "Test!1@2", "test", "test@test.com", "ADMIN", null);
    client.release();

    const responseSignin = await agent.post("/auth/signin").send({ id: "test", pw: "Test!1@2" });
    const accessTokenCookie = responseSignin.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("accessToken=")
    );

    const res = await agent
      .post("/restaurants/categories")
      .set("Cookie", accessTokenCookie)
      .send({ category_name: "테스트" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
  });

  it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const client = await pool.connect();
    authService.createUserAtDb(client, "test", "Test!1@2", "test", "test@test.com", "ADMIN", null);
    client.release();

    const responseSignin = await agent.post("/auth/signin").send({ id: "test", pw: "Test!1@2" });
    const accessTokenCookie = responseSignin.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("accessToken=")
    );

    const res = await agent
      .post("/restaurants/categories")
      .set("Cookie", accessTokenCookie)
      .send({ category_name: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("category_name");
  });

  it("인증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const res = await agent.post("/restaurants/categories").send({ category_name: "떡" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("토큰 없음");
  });

  it("권한이 없는 경우 상태코드 403을 응답해야한다.", async () => {
    const client = await pool.connect();
    authService.createUserAtDb(client, "test", "Test!1@2", "test", "test@test.com", "USER", null);
    client.release();

    const responseSignin = await agent.post("/auth/signin").send({ id: "test", pw: "Test!1@2" });
    const accessTokenCookie = responseSignin.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("accessToken=")
    );

    const res = await agent
      .post("/restaurants/categories")
      .set("Cookie", accessTokenCookie)
      .send({ category_name: "테스트" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("권한 없음");
  });
});
