jest.mock("../utils/jwt");

const jwt = require("../utils/jwt");
const commonErrorResponse = require("../utils/customErrorResponse");
const verifyAccessToken = require("./verifyAccessToken");

describe("verifyAccessToken", () => {
  it("토큰이 만료된 경우 상태코드 401과 안내 메시지로 예외를 발생시켜야한다.", async () => {
    const req = {
      cookies: { token: "expired-token" },
    };
    const res = {};
    const next = jest.fn();

    jwt.verifyToken.mockReturnValue({ isValid: false, results: "TokenExpiredError" });

    await verifyAccessToken(req, res, next);

    expect(jwt.verifyToken).toHaveBeenCalled();
    const error = commonErrorResponse(401, "토큰 만료");
    expect(next).toHaveBeenCalledWith(error);
  });

  it("토큰이 유효하지 않은 경우 상태코드 401과 안내 메시지로 예외를 발생시켜야한다.", async () => {
    const req = {
      cookies: { token: "invalid-token" },
    };
    const res = {};
    const next = jest.fn();

    jwt.verifyToken.mockReturnValue({ isValid: false, results: "JsonWebTokenError" });

    await verifyAccessToken(req, res, next);

    expect(jwt.verifyToken).toHaveBeenCalled();
    const error = commonErrorResponse(401, "유효하지 않은 토큰");
    expect(next).toHaveBeenCalledWith(error);
    expect(req.token).toBe(undefined);
  });

  it("토큰 디코딩 중 오류가 발생한 경우 상태코드 500과 안내 메시지로 예외를 발생시켜야한다.", async () => {
    const req = {
      cookies: { token: "some-token" },
    };
    const res = {};
    const next = jest.fn();

    jwt.verifyToken.mockReturnValue({ isValid: false, results: null });

    await verifyAccessToken(req, res, next);

    expect(jwt.verifyToken).toHaveBeenCalled();
    const error = commonErrorResponse(500, "토큰 디코딩 중 오류 발생");
    expect(next).toHaveBeenCalledWith(error);
    expect(req.token).toBe(undefined);
  });

  it("토큰이 정상적으로 디코딩된 경우 req 객체에 저장하고 다음 미들웨어를 호출해야한다.", async () => {
    const req = {
      cookies: { token: "right-token" },
    };
    const res = {};
    const next = jest.fn();

    jwt.verifyToken.mockReturnValue({ isValid: true, results: "decoded-token" });

    await verifyAccessToken(req, res, next);

    expect(jwt.verifyToken).toHaveBeenCalled();
    expect(req.token).toBe("decoded-token");
    expect(next).toHaveBeenCalled();
  });
});
