require("dotenv").config();

const jwt = require("jsonwebtoken");
const { createAccessToken, createRefreshToken, verifyToken } = require("./jwt");
const customErrorResponse = require("./customErrorResponse");

jest.mock("jsonwebtoken");

describe("createAccessToken", () => {
  const invalidPayload = ["", [], undefined, null, {}, 123];
  it.each(invalidPayload)("payload가 유효하지 않으면 예외를 발생시켜야 한다.", (payload) => {
    try {
      createAccessToken({ payload });
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("payload 확인 필요");

      const errRes = customErrorResponse({ status: err.status, message: err.message });
      expect(errRes).toBeInstanceOf(Error);
      expect(errRes).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "payload 확인 필요",
        })
      );
    }
  });

  it("payload가 유효하지만 환경 변수가 유효하지 않으면 예외를 발생시켜야 한다.", () => {
    process.env.JWT_ACCESS_SECRET = "";
    const payload = { payload_a: "a" };

    try {
      createAccessToken({ payload });
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("access 토큰 생성 jwt 환경 변수 확인 필요");

      const errRes = customErrorResponse({ status: err.status, message: err.message });
      expect(errRes).toBeInstanceOf(Error);
      expect(errRes).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "access 토큰 생성 jwt 환경 변수 확인 필요",
        })
      );
    }
  });

  it("payload, 환경 변수가 유효하면 토큰을 리턴해야한다.", () => {
    const payload = { payload_a: "a" };
    process.env.JWT_ACCESS_SECRET = "some_scret";

    jwt.sign.mockReturnValue("some_access_token");

    const token = createAccessToken({ payload });

    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(token).toBe("some_access_token");
  });
});

describe("createRefreshToken", () => {
  const invalidPayload = ["", [], undefined, null, {}, 123];
  it.each(invalidPayload)("payload가 유효하지 않으면 예외를 발생시켜야 한다.", (payload) => {
    try {
      createRefreshToken({ payload });
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("payload 확인 필요");

      const errRes = customErrorResponse({ status: err.status, message: err.message });
      expect(errRes).toBeInstanceOf(Error);
      expect(errRes).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "payload 확인 필요",
        })
      );
    }
  });

  it("payload가 유효하지만 환경 변수가 유효하지 않으면 예외를 발생시켜야 한다.", () => {
    process.env.JWT_REFRESH_SECRET = "";
    const payload = { payload_a: "a" };
    try {
      createRefreshToken({ payload });
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("refresh 토큰 생성 jwt 환경 변수 확인 필요");

      const errRes = customErrorResponse({ status: err.status, message: err.message });
      expect(errRes).toBeInstanceOf(Error);
      expect(errRes).toMatchObject(
        expect.objectContaining({
          status: 500,
          message: "refresh 토큰 생성 jwt 환경 변수 확인 필요",
        })
      );
    }
  });

  it("payload, 환경 변수가 유효하면 토큰을 리턴해야한다.", () => {
    const payload = { payload_a: "a" };
    process.env.JWT_REFRESH_SECRET = "some_scret";

    jwt.sign.mockReturnValue("some_refresh_token");

    const token = createRefreshToken({ payload });

    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(token).toBe("some_refresh_token");
  });
});

describe("verifyToken", () => {
  const invalidToken = ["", [], undefined, null, {}, 123];
  it.each(invalidToken)("token이 유효하지 않으면 예외를 발생시켜야한다.", (token) => {
    try {
      verifyToken({ token });
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("token 확인 필요");

      const errRes = customErrorResponse({ status: err.status, message: err.message });
      expect(errRes).toBeInstanceOf(Error);
      expect(errRes).toMatchObject(
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
      verifyToken({ token });
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("환경 변수 JWT_ACCESS_SECRET 확인 필요");

      const errRes = customErrorResponse({ status: err.status, message: err.message });
      expect(errRes).toBeInstanceOf(Error);
      expect(errRes).toMatchObject(
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

    const returnVierify = "decoded_access_token";
    const verifySpy = jest.spyOn(jwt, "verify").mockReturnValue(returnVierify);

    const decoded = verifyToken({ token });

    expect(verifySpy).toHaveBeenCalledTimes(1);
    expect(decoded.results).toStrictEqual(returnVierify);
  });

  it("refresh token 디코딩하는 경우 토큰이 유효하지만 환경 변수가 유효하지 않으면 예외를 발생시켜야 한다.", () => {
    process.env.JWT_REFRESH_SECRET = "";
    const token = "some_refresh_token";
    try {
      verifyToken({ token, isRefresh: true });
    } catch (err) {
      expect(err.status).toBe(500);
      expect(err.message).toBe("환경 변수 JWT_REFRESH_SECRET 확인 필요");

      const errRes = customErrorResponse({ status: err.status, message: err.message });
      expect(errRes).toBeInstanceOf(Error);
      expect(errRes).toMatchObject(
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

    const returnVierify = "decoded_refresh_token";
    const verifySpy = jest.spyOn(jwt, "verify").mockReturnValue(returnVierify);

    const decoded = verifyToken({ token, isRefresh: true });

    expect(verifySpy).toHaveBeenCalledTimes(1);
    expect(decoded.results).toStrictEqual(returnVierify);
  });
});
