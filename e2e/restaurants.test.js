const request = require("supertest");
const app = require("../server");
const pool = require("../database/db");
const authService = require("../domains/auth/service");
const {
  createTempUserReturnIdx,
  getCookieSavedAccessTokenAfterSignin,
  createTempCateoryReturnIdx,
} = require("./helpers/setupForTest");

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
    const id = "test";
    const pw = "Test!1@2";

    await createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const cookie = await getCookieSavedAccessTokenAfterSignin({ id, pw });

    const res = await agent
      .post("/restaurants/categories")
      .set("Cookie", cookie)
      .send({ category_name: "테스트" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
  });

  it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    await createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const cookie = await getCookieSavedAccessTokenAfterSignin({ id, pw });

    const res = await agent
      .post("/restaurants/categories")
      .set("Cookie", cookie)
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
    const id = "test";
    const pw = "Test!1@2";

    await createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "USER",
    });

    const cookie = await getCookieSavedAccessTokenAfterSignin({ id, pw });

    const res = await agent
      .post("/restaurants/categories")
      .set("Cookie", cookie)
      .send({ category_name: "테스트" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("권한 없음");
  });
});

describe("GET /categories", () => {
  const agent = request(app);
  it("조회 성공한 경우 상태코드 200과 카테고리 리스트를 응답해야한다.", async () => {
    const users_idx = await createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    await createTempCateoryReturnIdx({ users_idx, category_name: "테스트" });

    const res = await agent.get("/restaurants/categories");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
    expect(res.body.data).toStrictEqual(expect.any(Array));
  });

  it("include_deleted가 true인 경우 상태코드 200과 비활성화된 카테고리를 포함한 리스트를 응답해야한다.", async () => {
    const users_idx = await createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    await createTempCateoryReturnIdx({ users_idx, category_name: "테스트" });

    const res = await agent.get("/restaurants/categories?include_deleted=true");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
    expect(res.body.data).toStrictEqual(expect.any(Array));
  });
});

describe("PUT /categories/:category_idx", () => {
  const agent = request(app);
  it("카테고리 수정 성공한 경우 상태코드 200을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    const users_idx = await createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const category_idx = await createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트",
    });

    const cookie = await getCookieSavedAccessTokenAfterSignin({ id, pw });

    const res = await agent
      .put(`/restaurants/categories/${category_idx}`)
      .set("Cookie", cookie)
      .send({ category_name: "수정 카테고리" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
  });

  it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    const users_idx = await createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const category_idx = await createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트",
    });

    const cookie = await getCookieSavedAccessTokenAfterSignin({ id, pw });

    const res = await agent
      .put(`/restaurants/categories/${category_idx}`)
      .set("Cookie", cookie)
      .send({ category_name: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("category_name");
  });

  it("수정 대상이 없는 경우 상태코드 404를 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    await createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const cookie = await getCookieSavedAccessTokenAfterSignin({ id, pw });

    const res = await agent
      .put(`/restaurants/categories/1`)
      .set("Cookie", cookie)
      .send({ category_name: "수정 카테고리" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("수정 대상 없음");
  });
});
