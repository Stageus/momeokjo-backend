const request = require("supertest");
const app = require("../server");
const pool = require("../database/db");
const helper = require("./helpers/setupForTest");

afterEach(async () => {
  const client = await pool.connect();
  await client.query("DELETE FROM reviews.likes");
  await client.query("DELETE FROM menus.likes");
  await client.query("DELETE FROM restaurants.likes");
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

describe("PUT /users", () => {
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

  it("로그인 하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
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
    expect(res.body.message).toBe("로그인 필요");
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
    expect(res.body.message).toBe("사용자 정보 수정 대상 없음");
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

describe("GET /users/:users_idx", () => {
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

describe("POST /users/likes/restaurants/:restaurants_idx", () => {
  const agent = request(app);
  it("음식점 즐겨찾기 등록 성공한 경우 상태코드 200을 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    const restaurants_idx = await helper.createTempRestaurantReturnIdx({
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

    const res = await agent
      .post(`/users/likes/restaurants/${restaurants_idx}`)
      .set("Cookie", cookie);

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

    const res = await agent.post(`/users/likes/restaurants/bbasdfasfs`).set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("restaurants_idx");
  });

  it("음식점 없는 경우 상태코드 400을 응답해야한다.", async () => {
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

    const res = await agent.post(`/users/likes/restaurants/1`).set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
  });

  it("인증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    const restaurants_idx = await helper.createTempRestaurantReturnIdx({
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

    const res = await agent.post(`/users/likes/restaurants/${restaurants_idx}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("로그인 필요");
  });

  it("중복 즐겨찾기한 경우 상태코드 409를 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    const restaurants_idx = await helper.createTempRestaurantReturnIdx({
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

    await helper.createTempRestaurantLikes({ restaurants_idx, users_idx });

    const res = await agent
      .post(`/users/likes/restaurants/${restaurants_idx}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 음식점 즐겨찾기 등록");
  });
});

describe("DELETE /users/likes/restaurants/:restaurants_idx", () => {
  const agent = request(app);
  it("음식점 즐겨찾기 취소 성공한 경우 상태코드 200을 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    const restaurants_idx = await helper.createTempRestaurantReturnIdx({
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

    await helper.createTempRestaurantLikes({ restaurants_idx, users_idx });

    const res = await agent
      .delete(`/users/likes/restaurants/${restaurants_idx}`)
      .set("Cookie", cookie);

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

    const res = await agent.delete(`/users/likes/restaurants/asdfasdfasdf`).set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("restaurants_idx");
  });

  it("인증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const res = await agent.delete(`/users/likes/restaurants/1`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("로그인 필요");
  });

  it("음식점 즐겨찾기 내역이 없는 경우 상태코드 404를 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    const restaurants_idx = await helper.createTempRestaurantReturnIdx({
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

    const res = await agent
      .delete(`/users/likes/restaurants/${restaurants_idx}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("음식점 즐겨찾기 없음");
  });
});

describe("POST /users/likes/menus/:menu_idx", () => {
  const agent = request(app);
  it("메뉴 추천 등록 성공한 경우 상태코드 200을 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    const restaurants_idx = await helper.createTempRestaurantReturnIdx({
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

    const menu_idx = await helper.createTempMenuReturnIdx({
      users_idx,
      restaurants_idx,
      menu_name: "테스트 메뉴",
      price: "10000",
    });

    const res = await agent.post(`/users/likes/menus/${menu_idx}`).set("Cookie", cookie);

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

    const res = await agent.post(`/users/likes/menus/asdfasdf`).set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("menus_idx");
  });

  it("인증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    await helper.createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      oauth_idx: null,
    });

    const res = await agent.post(`/users/likes/menus/1`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("로그인 필요");
  });

  it("메뉴 없는 경우 상태코드 404를 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    await helper.createTempRestaurantReturnIdx({
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

    const res = await agent.post(`/users/likes/menus/1`).set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("메뉴 없음");
  });

  it("중복 메뉴 추천한 경우 상태코드 409를 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    const restaurants_idx = await helper.createTempRestaurantReturnIdx({
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

    const menu_idx = await helper.createTempMenuReturnIdx({
      users_idx,
      restaurants_idx,
      menu_name: "테스트 메뉴",
      price: "10000",
    });

    await helper.createTempMenuLikes({ menu_idx, users_idx });

    const res = await agent.post(`/users/likes/menus/${menu_idx}`).set("Cookie", cookie);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 메뉴 추천 등록");
  });
});

describe("DELETE /users/likes/menus/:menu_idx", () => {
  const agent = request(app);
  it("메뉴 추천 취소 성공한 경우 상태코드 200을 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    const restaurants_idx = await helper.createTempRestaurantReturnIdx({
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

    const menu_idx = await helper.createTempMenuReturnIdx({
      users_idx,
      restaurants_idx,
      menu_name: "테스트 메뉴",
      price: "10000",
    });

    await helper.createTempMenuLikes({ menu_idx, users_idx });

    const res = await agent.delete(`/users/likes/menus/${menu_idx}`).set("Cookie", cookie);

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

    const res = await agent.delete(`/users/likes/menus/asdasdfas`).set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("menus_idx");
  });

  it("인증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const res = await agent.delete(`/users/likes/menus/1`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("로그인 필요");
  });

  it("메뉴 추천 내역 없는 경우 상태코드 404를 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    const restaurants_idx = await helper.createTempRestaurantReturnIdx({
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

    const menu_idx = await helper.createTempMenuReturnIdx({
      users_idx,
      restaurants_idx,
      menu_name: "테스트 메뉴",
      price: "10000",
    });

    await helper.createTempMenuLikes({ menu_idx, users_idx });

    const res = await agent.delete(`/users/likes/menus/${menu_idx + 1}`).set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("메뉴 추천 내역 없음");
  });
});

describe("POST /users/likes/reviews/:reviews_idx", () => {
  const agent = request(app);
  it("후기 좋아요 등록 성공한 경우 상태코드 200을 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    const restaurants_idx = await helper.createTempRestaurantReturnIdx({
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

    const menu_idx = await helper.createTempMenuReturnIdx({
      users_idx,
      restaurants_idx,
      menu_name: "테스트 메뉴",
      price: "10000",
    });

    const reviews_idx = await helper.createTempReviewReturnIdx({
      users_idx,
      menu_idx,
      content: "테스트 후기",
      image_url: "",
      restaurants_idx,
    });

    const res = await agent.post(`/users/likes/reviews/${reviews_idx}`).set("Cookie", cookie);

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

    const res = await agent.post(`/users/likes/reviews/asdfasdfasdf`).set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("reviews_idx");
  });

  it("인증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const res = await agent.post(`/users/likes/reviews/1`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("로그인 필요");
  });

  it("후기가 없는 경우 상태코드 404를 응답해야한다.", async () => {
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

    const res = await agent.post(`/users/likes/reviews/1`).set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("후기 없음");
  });

  it("중복 후기 좋아요한 경우 상태코드 409를 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    const restaurants_idx = await helper.createTempRestaurantReturnIdx({
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

    const menu_idx = await helper.createTempMenuReturnIdx({
      users_idx,
      restaurants_idx,
      menu_name: "테스트 메뉴",
      price: "10000",
    });

    const review_idx = await helper.createTempReviewReturnIdx({
      users_idx,
      menu_idx,
      content: "테스트 후기",
      image_url: "",
      restaurants_idx,
    });

    await helper.createTempReviewLikes({
      review_idx,
      users_idx,
    });

    const res = await agent.post(`/users/likes/reviews/${review_idx}`).set("Cookie", cookie);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("중복 후기 좋아요 등록");
  });
});

describe("DELETE /users/likes/reviews/:review_idx", () => {
  const agent = request(app);
  it("후기 좋아요 취소 성공한 경우 상태코드 200을 응답해야한다.", async () => {
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

    const category_idx = await helper.createTempCateoryReturnIdx({
      users_idx,
      category_name: "테스트 카테고리",
    });

    const restaurants_idx = await helper.createTempRestaurantReturnIdx({
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

    const menu_idx = await helper.createTempMenuReturnIdx({
      users_idx,
      restaurants_idx,
      menu_name: "테스트 메뉴",
      price: "10000",
    });

    const review_idx = await helper.createTempReviewReturnIdx({
      users_idx,
      menu_idx,
      content: "테스트 후기",
      image_url: "",
      restaurants_idx,
    });

    await helper.createTempReviewLikes({
      review_idx,
      users_idx,
    });

    const res = await agent.delete(`/users/likes/reviews/${review_idx}`).set("Cookie", cookie);

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

    const res = await agent.delete(`/users/likes/reviews/adfasdfasdfasdf`).set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("reviews_idx");
  });

  it("인증이 유효하지 않은 경우 상태코그 401을 응답해야한다.", async () => {
    const res = await agent.delete(`/users/likes/reviews/1`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("로그인 필요");
  });

  it("후기 좋아요 내역 없는 경우 상태코드 404를 응답해야한다.", async () => {
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

    const res = await agent.delete(`/users/likes/reviews/1`).set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("후기 좋아요 내역 없음");
  });
});
