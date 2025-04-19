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

  it("로그인 하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
    const res = await agent.post("/restaurants/categories").send({ category_name: "떡" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("로그인 필요");
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

  it("로그인 하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
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

    const res = await agent
      .put(`/restaurants/categories/${category_idx}`)
      .send({ category_name: "수정 카테고리" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("로그인 필요");
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
    expect(res.body.message).toBe("카테고리 수정 대상 없음");
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

  it("카테고리가 없는 경우 상태코드 400을 응답해야한다.", async () => {
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

    const res = await agent.post("/restaurants").set("Cookie", cookie).send({
      category_idx: 1,
      restaurant_name: "테스트 음식점",
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
    expect(res.body.target).toBe("category_idx");
  });

  it("로그인 하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
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
    expect(res.body.message).toBe("로그인 필요");
  });
});

describe("GET /restaurants/:restaurants_idx", () => {
  const agent = request(app);
  it("음식점 조회 성공한 경우 상태코드 200과 음식점 상세정보를 응답해야한다.", async () => {
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

    const res = await agent.get(`/restaurants/${restaurants_idx}`).set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("요청 처리 성공");
    expect(res.body.data).toStrictEqual(expect.any(Object));
  });

  it("restaurants_idx가 유효하지 않으면 상태코드 400을 응답해야한다.", async () => {
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

    const res = await agent.get(`/restaurants/asdfasdf`).set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("restaurants_idx");
  });

  it("음식점 정보가 없으면 상태코드 404을 응답해야한다.", async () => {
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
    expect(res.body.message).toBe("음식점 정보 없음");
  });
});

describe("PUT /:restaurant_idx", () => {
  const agent = request(app);
  it("음식점 정보 수정에 성공한 경우 상태코드 200을 응답해야한다.", async () => {
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

    const res = await agent.put(`/restaurants/${restaurants_idx}`).set("Cookie", cookie).send({
      category_idx,
      restaurant_name: "테스트 음식점 수정",
      address_detail: "테스트 음식점 상세 주소 수정",
      phone: "021234567",
      start_time: "0000",
      end_time: "0100",
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

    const res = await agent.put(`/restaurants/${restaurants_idx}`).set("Cookie", cookie).send({
      category_idx,
      restaurant_name: "",
      address_detail: "테스트 음식점 상세 주소 수정",
      phone: "021234567",
      start_time: "0000",
      end_time: "0100",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
    expect(res.body.target).toBe("restaurant_name");
  });

  it("인증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
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

    const res = await agent.put(`/restaurants/${restaurant_idx}`).send({
      category_idx,
      restaurant_name: "테스트 음식점 수정",
      address_detail: "테스트 음식점 상세 주소 수정",
      phone: "021234567",
      start_time: "0000",
      end_time: "0100",
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("로그인 필요");
  });

  it("수정 대상 없는 경우 상태코드 404를 응답해야한다.", async () => {
    const users_idx = await helper.createTempUserReturnIdx({
      id: "test",
      pw: "Test!1@2",
      nickname: "test",
      email: "test@test.com",
      role: "ADMIN",
    });

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

    const diff_user_id = "test1";
    const diff_user_pw = "Test!1@2";
    await helper.createTempUserReturnIdx({
      id: "test1",
      pw: "Test!1@2",
      nickname: "test1",
      email: "test1@test.com",
      role: "ADMIN",
    });

    const cookie = await helper.getCookieSavedAccessTokenAfterSignin({
      id: diff_user_id,
      pw: diff_user_pw,
    });

    const res = await agent.put(`/restaurants/${restaurant_idx}`).set("Cookie", cookie).send({
      category_idx,
      restaurant_name: "테스트 음식점 수정",
      address_detail: "테스트 음식점 상세 주소 수정",
      phone: "021234567",
      start_time: "0000",
      end_time: "0100",
    });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("음식점 정보 없음");
  });
});

// describe("GET /restaurants", () => {
//   const agent = request(app);
//   it("음식점 리스트 조회 성공한 경우 상태코드 200과 음식점 리스트를 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const res = await agent
//       .get("/restaurants")
//       .set("Cookie", cookie)
//       .send({ user_longitude: "127.0316", user_latitude: "37.4970" });

//     expect(res.status).toBe(200);
//     expect(res.body.message).toBe("요청 처리 성공");
//     expect(res.body.data).toStrictEqual(expect.any(Array));
//   });

//   it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const res = await agent
//       .get("/restaurants?range=500")
//       .set("Cookie", cookie)
//       .send({ user_longitude: "", user_latitude: "37.4970" });

//     expect(res.status).toBe(400);
//     expect(res.body.message).toBe("입력값 확인 필요");
//     expect(res.body.target).toBe("user_longitude");
//   });
// });

// describe("GET /restaurants/recommands", () => {
//   const agent = request(app);
//   it("음식점 랜덤 추천 성공한 경우 상태코드 200과 음식점 상세정보를 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const res = await agent
//       .get("/restaurants/recommends")
//       .set("Cookie", cookie)
//       .send({ user_longitude: "127.0316", user_latitude: "37.4970" });

//     expect(res.status).toBe(200);
//     expect(res.body.message).toBe("요청 처리 성공");
//     expect(res.body.data).toStrictEqual(expect.any(Object));
//   });

//   it("입력값이 유효하지 않으면 상태코드 400을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const res = await agent
//       .get("/restaurants/recommends")
//       .set("Cookie", cookie)
//       .send({ user_longitude: "", user_latitude: "37.4970" });

//     expect(res.status).toBe(400);
//     expect(res.body.message).toBe("입력값 확인 필요");
//     expect(res.body.target).toBe("user_longitude");
//   });
// });

// describe("POST /:restaurant_idx/menus", () => {
//   const agent = request(app);
//   it("음식점 메뉴 등록 성공한 경우 상태코드 200을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const res = await agent
//       .post(`/restaurants/${restaurant_idx}/menus`)
//       .set("Cookie", cookie)
//       .send({ menu_name: "테스트 메뉴", price: "10000" });

//     expect(res.status).toBe(200);
//     expect(res.body.message).toBe("요청 처리 성공");
//   });

//   it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const res = await agent
//       .post(`/restaurants/${restaurant_idx}/menus`)
//       .set("Cookie", cookie)
//       .send({ menu_name: "", price: "10000" });

//     expect(res.status).toBe(400);
//     expect(res.body.message).toBe("입력값 확인 필요");
//     expect(res.body.target).toBe("menu_name");
//   });

//   it("인증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const res = await agent
//       .post(`/restaurants/${restaurant_idx}/menus`)
//       .send({ menu_name: "테스트 메뉴", price: "10000" });

//     expect(res.status).toBe(401);
//     expect(res.body.message).toBe("토큰 없음");
//   });

//   it("음식점 없는 경우 상태코드 404를 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const res = await agent
//       .post(`/restaurants/1/menus`)
//       .set("Cookie", cookie)
//       .send({ menu_name: "테스트 메뉴", price: "10000" });

//     expect(res.status).toBe(404);
//     expect(res.body.message).toBe("음식점 없음");
//     expect(res.body.target).toBe("restaurant_idx");
//   });
// });

// describe("PUT /menus/:menus_idx", () => {
//   const agent = request(app);
//   it("음식점 메뉴 수정을 성공한 경우 상태코드 200을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const res = await agent
//       .put(`/restaurants/menus/${menu_idx}`)
//       .set("Cookie", cookie)
//       .send({ menu_name: "테스트 메뉴 수정", price: "20000" });

//     expect(res.status).toBe(200);
//     expect(res.body.message).toBe("요청 처리 성공");
//   });

//   it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const res = await agent
//       .put(`/restaurants/menus/${menu_idx}`)
//       .set("Cookie", cookie)
//       .send({ menu_name: "", price: "20000" });

//     expect(res.status).toBe(400);
//     expect(res.body.message).toBe("입력값 확인 필요");
//     expect(res.body.target).toBe("menu_name");
//   });

//   it("인증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const res = await agent
//       .put(`/restaurants/menus/${menu_idx}`)
//       .send({ menu_name: "", price: "20000" });

//     expect(res.status).toBe(401);
//     expect(res.body.message).toBe("토큰 없음");
//   });

//   it("수정 대상이 없는 경우 상태코드 404을 응답해야한다.", async () => {
//     const users_idx = await helper.createTempUserReturnIdx({
//       id: "test",
//       pw: "Test!1@2",
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const diff_user_id = "test1";
//     const diff_user_pw = "Test!1@2";
//     await helper.createTempUserReturnIdx({
//       id: diff_user_id,
//       pw: diff_user_pw,
//       nickname: "test1",
//       email: "test1@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({
//       id: diff_user_id,
//       pw: diff_user_pw,
//     });

//     const res = await agent
//       .put(`/restaurants/menus/${menu_idx}`)
//       .set("Cookie", cookie)
//       .send({ menu_name: "테스트 메뉴", price: "20000" });

//     expect(res.status).toBe(404);
//     expect(res.body.message).toBe("조회 결과 없음");
//   });
// });

// describe("GET /:restaurant_idx/menus", () => {
//   const agent = request(app);
//   it("음식점 메뉴 리스트 조회 성공한 경우 상태코드 200과 메뉴 리스트를 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const res = await agent.get(`/restaurants/${restaurant_idx}/menus`).set("Cookie", cookie);

//     expect(res.status).toBe(200);
//     expect(res.body.message).toBe("요청 처리 성공");
//     expect(res.body.data).toStrictEqual(expect.any(Array));
//   });

//   it("입력값이 유효하지 않는 경우 상태코드 400을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const res = await agent.get(`/restaurants/ㅁㄴㅇㄹㅁㄴㅇㄹ/menus`).set("Cookie", cookie);

//     expect(res.status).toBe(400);
//     expect(res.body.message).toBe("입력값 확인 필요");
//     expect(res.body.target).toBe("restaurant_idx");
//   });
// });

// describe("POST /menus/:review_idx/review", () => {
//   const agent = request(app);
//   it("후기 등록 성공한 경우 상태코드 200을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const res = await agent
//       .post(`/restaurants/menus/${menu_idx}/reviews`)
//       .set("Cookie", cookie)
//       .field("content", "테스트 후기");

//     expect(res.status).toBe(200);
//     expect(res.body.message).toBe("요청 처리 성공");
//   });

//   it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const res = await agent
//       .post(`/restaurants/menus/${menu_idx}/reviews`)
//       .set("Cookie", cookie)
//       .field("content", "");

//     expect(res.status).toBe(400);
//     expect(res.body.message).toBe("입력값 확인 필요");
//     expect(res.body.target).toBe("content");
//   });

//   it("인증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const res = await agent
//       .post(`/restaurants/menus/${menu_idx}/reviews`)
//       .field("content", "테스트 후기");

//     expect(res.status).toBe(401);
//     expect(res.body.message).toBe("토큰 없음");
//   });

//   it("메뉴 없는 경우 상태코드 404를 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const res = await agent
//       .post(`/restaurants/menus/1/reviews`)
//       .set("Cookie", cookie)
//       .field("content", "테스트 후기");

//     expect(res.status).toBe(404);
//     expect(res.body.message).toBe("메뉴 없음");
//   });
// });

// describe("PUT /menus/reviews/:review_idx", () => {
//   const agent = request(app);
//   it("후기 수정에 성공한 경우 상태코드 200을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const review_idx = await helper.createTempReviewReturnIdx({
//       users_idx,
//       menu_idx,
//       content: "테스트 후기",
//       image_url: "",
//     });

//     const res = await agent
//       .put(`/restaurants/menus/reviews/${review_idx}`)
//       .set("Cookie", cookie)
//       .field("content", "테스트 후기 수정");

//     expect(res.status).toBe(200);
//     expect(res.body.message).toBe("요청 처리 성공");
//   });

//   it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const review_idx = await helper.createTempReviewReturnIdx({
//       users_idx,
//       menu_idx,
//       content: "테스트 후기",
//       image_url: "",
//     });

//     const res = await agent
//       .put(`/restaurants/menus/reviews/${review_idx}`)
//       .set("Cookie", cookie)
//       .field("content", "");

//     expect(res.status).toBe(400);
//     expect(res.body.message).toBe("입력값 확인 필요");
//     expect(res.body.target).toBe("content");
//   });

//   it("인증이 유효하지 않은 경우 상태코드 401을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     const review_idx = await helper.createTempReviewReturnIdx({
//       users_idx,
//       menu_idx,
//       content: "테스트 후기",
//       image_url: "",
//     });

//     const res = await agent
//       .put(`/restaurants/menus/reviews/${review_idx}`)
//       .field("content", "테스트 후기 수정");

//     expect(res.status).toBe(401);
//     expect(res.body.message).toBe("토큰 없음");
//   });

//   it("수정 대상이 없는 경우 상태코드 404를 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     await helper.createTempReviewReturnIdx({
//       users_idx,
//       menu_idx,
//       content: "테스트 후기",
//       image_url: "",
//     });

//     const res = await agent
//       .put(`/restaurants/menus/reviews/1`)
//       .set("Cookie", cookie)
//       .field("content", "테스트 후기 수정");

//     expect(res.status).toBe(404);
//     expect(res.body.message).toBe("조회 결과 없음");
//   });
// });

// describe("GET /menus/:menu_idx/reviews", () => {
//   const agent = request(app);
//   it("후기 리스트 조회 성공한 경우 상태코드 200과 후기 리스트를 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     await helper.createTempReviewReturnIdx({
//       users_idx,
//       menu_idx,
//       content: "테스트 후기",
//       image_url: "",
//     });

//     const res = await agent.get(`/restaurants/menus/${menu_idx}/reviews`).set("Cookie", cookie);

//     expect(res.status).toBe(200);
//     expect(res.body.message).toBe("요청 처리 성공");
//     expect(res.body.data).toStrictEqual(expect.any(Array));
//   });

//   it("입력값이 유효하지 않은 경우 상태코드 400을 응답해야한다.", async () => {
//     const id = "test";
//     const pw = "Test!1@2";
//     const users_idx = await helper.createTempUserReturnIdx({
//       id,
//       pw,
//       nickname: "test",
//       email: "test@test.com",
//       role: "ADMIN",
//     });

//     const cookie = await helper.getCookieSavedAccessTokenAfterSignin({ id, pw });

//     const category_idx = await helper.createTempCateoryReturnIdx({
//       users_idx,
//       category_name: "테스트",
//     });

//     const restaurant_idx = await helper.createTempRestaurantReturnIdx({
//       category_idx,
//       users_idx,
//       restaurant_name: "테스트 음식점",
//       longitude: "127.0316",
//       latitude: "37.4979",
//       address: "테스트 음식점 테스트로 123",
//       address_detail: "테스트 음식점 상세 주소",
//       phone: "01012345678",
//       start_time: "0000",
//       end_time: "0000",
//     });

//     const menu_idx = await helper.createTempMenuReturnIdx({
//       users_idx,
//       restaurant_idx,
//       menu_name: "테스트 메뉴",
//       price: "10000",
//     });

//     await helper.createTempReviewReturnIdx({
//       users_idx,
//       menu_idx,
//       content: "테스트 후기",
//       image_url: "",
//     });

//     const res = await agent.get(`/restaurants/menus/asdfasdfasdf/reviews`).set("Cookie", cookie);

//     expect(res.status).toBe(400);
//     expect(res.body.message).toBe("입력값 확인 필요");
//     expect(res.body.target).toBe("menu_idx");
//   });
// });
