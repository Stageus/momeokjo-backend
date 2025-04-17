const request = require("supertest");
const app = require("../server");
const pool = require("../database/db");

const helper = require("./helpers/setupForTest");

afterEach(async () => {
  const client = await pool.connect();
  await client.query("DELETE FROM restaurants.lists");
  await client.query("DELETE FROM restaurants.categories");
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

    await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

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

    await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

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

    await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "USER",
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

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
    const users_idx = await helper.createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    await helper.createTempCateoryReturnIdx({ users_idx, category_name: "테스트" });

    const res = await agent.get("/restaurants/categories");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
    expect(res.body.data).toStrictEqual(expect.any(Array));
  });

  it("include_deleted가 true인 경우 상태코드 200과 비활성화된 카테고리를 포함한 리스트를 응답해야한다.", async () => {
    const users_idx = await helper.createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    await helper.createTempCateoryReturnIdx({ users_idx, category_name: "테스트" });

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

    const users_idx = await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트",
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

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

    const users_idx = await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트",
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

    const res = await agent
      .put(`/restaurants/categories/${category_idx}`)
      .set("Cookie", cookie)
      .send({ category_name: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("category_name");
  });

  it("수정 권한이 없는 경우 403을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    const admin_users_idx = await helper.createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx: admin_users_idx,
      category_name: "테스트",
    });

    const user_id = "test1";
    const user_pw = "Test!1@2";
    await helper.createTempUserReturnIdx({
      id: user_id,
      pw: user_pw,
      nickname: "test1",
      email: "test1@test.com",
      role: "USER",
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id: user_id, pw: user_pw });

    const res = await agent
      .put(`/restaurants/categories/${category_idx}`)
      .set("Cookie", cookie)
      .send({ category_name: "수정 카테고리" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("권한 없음");
  });

  it("수정 대상이 없는 경우 상태코드 404를 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";

    await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

    const res = await agent
      .put(`/restaurants/categories/1`)
      .set("Cookie", cookie)
      .send({ category_name: "수정 카테고리" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("수정 대상 없음");
  });
});

describe("POST /", () => {
  const agent = request(app);
  it("음식점 등록에 성공하면 상태코드 200을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";
    const users_idx = await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트",
    });

    const res = await agent.post("/restaurants").set("Cookie", cookie).send({
      category_idx,
      restaurant_name: "테스트 음식점",
      longitude: "127.0316",
      latitude: "37.4979",
      address: "테스트 음식점 테스트로 123",
      address_detail: "테스트 음식점 상세 주소",
      phone: "01012345678",
      start_time: "0000",
      end_time: "0000",
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
  });

  it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";
    const users_idx = await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트",
    });

    const res = await agent.post("/restaurants").set("Cookie", cookie).send({
      category_idx,
      restaurant_name: "",
      longitude: "127.0316",
      latitude: "37.4979",
      address: "테스트 음식점 테스트로 123",
      address_detail: "테스트 음식점 상세 주소",
      phone: "01012345678",
      start_time: "0000",
      end_time: "0000",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("restaurant_name");
  });

  it("안증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";
    const users_idx = await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트",
    });

    const res = await agent.post("/restaurants").send({
      category_idx,
      restaurant_name: "",
      longitude: "127.0316",
      latitude: "37.4979",
      address: "테스트 음식점 테스트로 123",
      address_detail: "테스트 음식점 상세 주소",
      phone: "01012345678",
      start_time: "0000",
      end_time: "0000",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("토큰 없음");
  });
});

describe("GET /:restaurant_idx", () => {
  const agent = request(app);
  it("음식점 조회 성공한 경우 상태코드 200과 음식점 리스트를 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";
    const users_idx = await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트",
    });

    const restaurant_idx = await helper.createTempRestaurantReturnIdx({
      category_idx,
      users_idx,
      restaurant_name: "테스트 음식점",
      longitude: "127.0316",
      latitude: "37.4979",
      address: "테스트 음식점 테스트로 123",
      address_detail: "테스트 음식점 상세 주소",
      phone: "01012345678",
      start_time: "0000",
      end_time: "0000",
    });

    const res = await agent.get(`/restaurants/${restaurant_idx}`).set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
    expect(res.body.data).toStrictEqual(expect.any(Object));
  });

  it("조회 결과가 없으면 상태코드 404을 응답해야한다.", async () => {
    const id = "test";
    const pw = "Test!1@2";
    await helper.createTempUserReturnIdx({
      id,
      pw,
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

    const res = await agent.get(`/restaurants/1`).set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("조회 결과 없음");
  });
});
