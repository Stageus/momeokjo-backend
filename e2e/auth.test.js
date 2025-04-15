const request = require("supertest");
const app = require("../server");
const pool = require("../database/db");
const service = require("../domains/auth/service");

describe("POST /verify-email", () => {
  afterEach(async () => {
    const client = await pool.connect();
    await client.query("DELETE FROM users.codes");
    await client.query("DELETE FROM users.lists");
    client.release();
  });
  const agent = request(app);
  it("이메일이 유효하면 상태코드 200를 응답해야한다.", async () => {
    const res = await agent.post("/auth/verify-email").send({ email: "bluegyufordev@gmail.com" });

    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const hasEmailCookie = cookies.some((cookie) => cookie.startsWith("email="));
    expect(hasEmailCookie).toBe(true);
    expect(res.status).toBe(200);
  });

  it("이메일이 유효하지 않는 경우 상태코드 400을 응답해야한다.", async () => {
    const res = await agent.post("/auth/verify-email").send({ email: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("입력값 확인 필요");
  });

  it("이미 회원가입된 이메일인 경우 상태코드 409를 응답해야한다.", async () => {
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
