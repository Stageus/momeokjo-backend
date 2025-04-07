require("dotenv").config();

const jwt = require("jsonwebtoken");
const { createAccessToken, createRefreshToken, verifyToken } = require("./jwt");
const customErrorResponse = require("./customErrorResponse");

jest.mock("jsonwebtoken");

describe("createAccessToken", () => {
  const invalidPayload = ["", [], undefined, null, {}, 123];
  it.each(invalidPayload)("payload가 유효하지 않으면 예외를 발생시켜야 한다.", (payload) => {
    const expiresIn = "";
    try {
      createAccessToken(payload, expiresIn);
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("payload 확인 필요");

      expect(customErrorResponse(err.status, err.message)).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "payload 확인 필요",
        })
      );
    }
  });

  const invalidExpiresIn = ["", [], undefined, null, {}, 123];
  it.each(invalidExpiresIn)("expiresIn가 유효하지 않으면 예외를 발생시켜야 한다.", (expiresIn) => {
    const payload = { payload_a: "a" };
    try {
      createAccessToken(payload, expiresIn);
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("expiresIn 확인 필요");

      expect(customErrorResponse(err.status, err.message)).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "expiresIn 확인 필요",
        })
      );
    }
  });

  it("payload, expiresIn가 유효하지만 환경 변수가 유효하지 않으면 예외를 발생시켜야 한다.", () => {
    process.env.JWT_ACCESS_SECRET = "";
    const payload = { payload_a: "a" };
    const expiresIn = "15m";
    try {
      createAccessToken(payload, expiresIn);
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("환경 변수 JWT_ACCESS_SECRET 확인 필요");

      expect(customErrorResponse(err.status, err.message)).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "환경 변수 JWT_ACCESS_SECRET 확인 필요",
        })
      );
    }
  });

  it("payload, expiresIn, 환경 변수가 유효하면 토큰을 리턴해야한다.", () => {
    const payload = { payload_a: "a" };
    const expiresIn = "15m";
    process.env.JWT_ACCESS_SECRET = "some_scret";

    jwt.sign.mockReturnValue("some_access_token");

    const token = createAccessToken(payload, expiresIn);

    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(token).toBe("some_access_token");
  });
});

describe("createRefreshToken", () => {
  const invalidPayload = ["", [], undefined, null, {}, 123];
  it.each(invalidPayload)("payload가 유효하지 않으면 예외를 발생시켜야 한다.", (payload) => {
    const expiresIn = "";
    try {
      createRefreshToken(payload, expiresIn);
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("payload 확인 필요");

      expect(customErrorResponse(err.status, err.message)).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "payload 확인 필요",
        })
      );
    }
  });

  const invalidExpiresIn = ["", [], undefined, null, {}, 123];
  it.each(invalidExpiresIn)("expiresIn가 유효하지 않으면 예외를 발생시켜야 한다.", (expiresIn) => {
    const payload = { payload_a: "a" };
    try {
      createRefreshToken(payload, expiresIn);
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("expiresIn 확인 필요");

      expect(customErrorResponse(err.status, err.message)).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "expiresIn 확인 필요",
        })
      );
    }
  });

  it("payload, expiresIn가 유효하지만 환경 변수가 유효하지 않으면 예외를 발생시켜야 한다.", () => {
    process.env.JWT_REFRESH_SECRET = "";
    const payload = { payload_a: "a" };
    const expiresIn = "15m";
    try {
      createRefreshToken(payload, expiresIn);
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("환경 변수 JWT_REFRESH_SECRET 확인 필요");

      expect(customErrorResponse(err.status, err.message)).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "환경 변수 JWT_REFRESH_SECRET 확인 필요",
        })
      );
    }
  });

  it("payload, expiresIn, 환경 변수가 유효하면 토큰을 리턴해야한다.", () => {
    const payload = { payload_a: "a" };
    const expiresIn = "15m";
    process.env.JWT_REFRESH_SECRET = "some_scret";

    jwt.sign.mockReturnValue("some_refresh_token");

    const token = createRefreshToken(payload, expiresIn);

    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(token).toBe("some_refresh_token");
  });
});

describe("verifyToken", () => {
  const invalidToken = ["", [], undefined, null, {}, 123];
  it.each(invalidToken)("token이 유효하지 않으면 예외를 발생시켜야한다.", (token) => {
    try {
      verifyToken(token);
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("token 확인 필요");

      expect(customErrorResponse(err.status, err.message)).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "token 확인 필요",
        })
      );
    }
  });

  it("access token 디코딩하는 경우 토큰이 유효하지만 환경 변수가 유효하지 않으면 예외를 발생시켜야 한다.", () => {
    process.env.JWT_ACCESS_SECRET = "";
    const token = "some_access_token";
    try {
      verifyToken(token);
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("환경 변수 JWT_ACCESS_SECRET 확인 필요");

      expect(customErrorResponse(err.status, err.message)).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "환경 변수 JWT_ACCESS_SECRET 확인 필요",
        })
      );
    }
  });

  it("access token 디코딩 성공한 경우 디코딩된 값을 리턴해야한다.", () => {
    process.env.JWT_ACCESS_SECRET = "some_scret";
    const token = "some_access_token";

    jwt.verify.mockReturnValue("decoded_access_token");

    const decoded = verifyToken(token);
    expect(decoded).toBe("decoded_access_token");
  });

  it("refresh token 디코딩하는 경우 토큰이 유효하지만 환경 변수가 유효하지 않으면 예외를 발생시켜야 한다.", () => {
    process.env.JWT_REFRESH_SECRET = "";
    const token = "some_refresh_token";
    try {
      verifyToken(token, true);
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("환경 변수 JWT_REFRESH_SECRET 확인 필요");

      expect(customErrorResponse(err.status, err.message)).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "환경 변수 JWT_REFRESH_SECRET 확인 필요",
        })
      );
    }
  });

  it("refresh token 디코딩 성공한 경우 디코딩된 값을 리턴해야한다.", () => {
    process.env.JWT_REFRESH_SECRET = "some_scret";
    const token = "some_refresh_token";

    jwt.verify.mockReturnValue("decoded_refresh_token");

    const decoded = verifyToken(token, true);
    expect(decoded).toBe("decoded_refresh_token");
  });
});
