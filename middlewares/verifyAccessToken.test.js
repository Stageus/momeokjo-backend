require("dotenv").config();

const jwt = require("jsonwebtoken");
const customErrorResponse = require("../utils/customErrorResponse");
const verifyAccessToken = require("./verifyAccessToken");
const COOKIE_NAME = require("../utils/cookieName");
const { createTempUserReturnIdx } = require("../e2e/helpers/setupForTest");
const { accessTokenOptions } = require("../config/cookies");
const {
  initializeDatabase,
  clearDatabase,
  disconnectDatabse,
} = require("../e2e/helpers/setupDatabase");

let pool;
beforeAll(async () => {
  pool = await initializeDatabase();
});

afterAll(async () => {
  await disconnectDatabse();
});

describe("verifyAccessToken", () => {
  afterEach(async () => {
    await clearDatabase();
  });

  const cookieNameList = [
    COOKIE_NAME.ACCESS_TOKEN,
    COOKIE_NAME.EMAIL_AUTH_SEND,
    COOKIE_NAME.EMAIL_AUTH_VERIFIED,
    COOKIE_NAME.PASSWORD_RESET,
    COOKIE_NAME.OAUTH_INDEX,
    "",
  ];
  it.each(cookieNameList)(
    "토큰이 없는 경우 상태코드 401과 안내 메시지로 예외를 발생시켜야한다.",
    async (cookieName) => {
      const req = {
        cookies: {},
      };
      const res = {};
      const next = jest.fn();

      await verifyAccessToken(cookieName, pool)(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.status).toBe(401);
      expect(typeof error.message).toBe("string");
    }
  );

  it("액세트 토큰이 만료된 경우 리프레시 토큰이 있는 경우 액세스 토큰을 재발급해야한다.", async () => {
    const req = {
      cookies: {},
    };
    const res = {
      cookie: jest.fn(),
    };
    const next = jest.fn();

    const users_idx = await createTempUserReturnIdx({
      id: "test",
      pw: "Test!@34",
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      pool,
    });

    const expiredToken = jwt.sign(
      { users_idx, provider: "LOCAL", exp: Math.floor(Date.now() / 1000) - 10 },
      process.env.JWT_ACCESS_SECRET
    );

    const refreshToken = jwt.sign({ users_idx, role: "USER" }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: `${process.env.JWT_REFRESH_EXPIRES_IN}d`,
    });

    req.cookies[COOKIE_NAME.ACCESS_TOKEN] = expiredToken;
    req.cookies[COOKIE_NAME.REFRESH_TOKEN] = refreshToken;

    await verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN, pool)(req, res, next);

    expect(res.cookie).toHaveBeenCalledTimes(1);
    const accessToken = res.cookie.mock.calls[0][1];
    expect(res.cookie).toHaveBeenCalledWith(
      COOKIE_NAME.ACCESS_TOKEN,
      accessToken,
      accessTokenOptions
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("액세스 토큰과 리프레시 토큰이 만료된 경우 상태코드 401과 안내 메시지를 응답해야한다.", async () => {
    const req = {
      cookies: {},
    };
    const res = {};
    const next = jest.fn();

    const users_idx = await createTempUserReturnIdx({
      id: "test",
      pw: "Test!@34",
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      pool,
    });

    const expiredAccessToken = jwt.sign(
      { users_idx, provider: "LOCAL", exp: Math.floor(Date.now() / 1000) - 10 },
      process.env.JWT_ACCESS_SECRET
    );

    const expiredRefreshToken = jwt.sign(
      { users_idx, role: "USER", exp: Math.floor(Date.now() / 1000) - 10 },
      process.env.JWT_REFRESH_SECRET
    );

    req.cookies[COOKIE_NAME.ACCESS_TOKEN] = expiredAccessToken;
    req.cookies[COOKIE_NAME.REFRESH_TOKEN] = expiredRefreshToken;

    await verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN, pool)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = customErrorResponse({ status: 401, message: "로그인 필요" });
    expect(next).toHaveBeenCalledWith(error);
  });

  it("액세스 토큰이 만료되고 리프레시 토큰이 잘못된 경우 상태코드 401과 안내 메시지를 응답해야한다.", async () => {
    const req = {
      cookies: {},
    };
    const res = {};
    const next = jest.fn();

    const users_idx = await createTempUserReturnIdx({
      id: "test",
      pw: "Test!@34",
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      pool,
    });

    const expiredAccessToken = jwt.sign(
      { users_idx, provider: "LOCAL", exp: Math.floor(Date.now() / 1000) - 10 },
      process.env.JWT_ACCESS_SECRET
    );

    const wrongRefreshToken = jwt.sign({ users_idx, role: "USER" }, "wrong_secret_key", {
      expiresIn: `${process.env.JWT_REFRESH_EXPIRES_IN}d`,
    });

    req.cookies[COOKIE_NAME.ACCESS_TOKEN] = expiredAccessToken;
    req.cookies[COOKIE_NAME.REFRESH_TOKEN] = wrongRefreshToken;

    await verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN, pool)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = customErrorResponse({ status: 401, message: "잘못된 토큰" });
    expect(next).toHaveBeenCalledWith(error);
  });

  it("액세스 토큰이 잘못된 경우 상태코드 401과 안내 메시지를 응답해야한다.", async () => {
    const req = {
      cookies: {},
    };
    const res = {};
    const next = jest.fn();

    const wrongToken = jwt.sign(
      { users_idx: 1, provider: "LOCAL", exp: Math.floor(Date.now() / 1000) - 10 },
      "wrong_secret_key"
    );

    req.cookies[COOKIE_NAME.EMAIL_AUTH_SEND] = wrongToken;

    await verifyAccessToken(COOKIE_NAME.EMAIL_AUTH_SEND, pool)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    const error = customErrorResponse({ status: 401, message: "잘못된 토큰" });
    expect(next).toHaveBeenCalledWith(error);
  });

  it("토큰이 정상적으로 디코딩된 경우 req 객체에 저장하고 다음 미들웨어를 호출해야한다.", async () => {
    const req = {
      cookies: {},
    };
    const res = {
      cookie: jest.fn(),
    };
    const next = jest.fn();

    const users_idx = await createTempUserReturnIdx({
      id: "test",
      pw: "Test!@34",
      nickname: "test",
      email: "test@test.com",
      role: "USER",
      pool,
    });

    const accessToken = jwt.sign(
      { users_idx, provider: "LOCAL", role: "USER" },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: `${process.env.JWT_ACCESS_EXPIRES_IN}m`,
      }
    );

    const refreshToken = jwt.sign({ users_idx, role: "USER" }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: `${process.env.JWT_REFRESH_EXPIRES_IN}d`,
    });

    req.cookies[COOKIE_NAME.ACCESS_TOKEN] = accessToken;
    req.cookies[COOKIE_NAME.REFRESH_TOKEN] = refreshToken;

    await verifyAccessToken(COOKIE_NAME.ACCESS_TOKEN, pool)(req, res, next);

    expect(req[COOKIE_NAME.ACCESS_TOKEN]).toEqual(
      expect.objectContaining({
        users_idx,
        provider: "LOCAL",
        role: "USER",
      })
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
