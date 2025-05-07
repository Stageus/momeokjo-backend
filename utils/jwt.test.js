require("dotenv").config();

const jwt = require("jsonwebtoken");
const jwtUtils = require("./jwt");

describe("createAccessToken", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  const invalidPayload = ["", [], undefined, null, {}, 123];
  it.each(invalidPayload)("payload가 유효하지 않으면 예외를 발생시켜야 한다.", (payload) => {
    jest.spyOn(jwt, "sign").mockReturnValue();

    const { isCreated, results } = jwtUtils.createAccessToken({ payload });

    expect(jwt.sign).not.toHaveBeenCalled();
    expect(isCreated).toBe(false);
    expect(results).toBe("payload 확인 필요");
  });

  it("payload가 유효하지만 환경 변수가 유효하지 않으면 안내메시지를 응답해야한다.", () => {
    process.env.JWT_ACCESS_SECRET = "";
    const payload = { payload_a: "a" };

    jest.spyOn(jwt, "sign").mockReturnValue();

    const { isCreated, results } = jwtUtils.createAccessToken({ payload });

    expect(jwt.sign).not.toHaveBeenCalled();
    expect(isCreated).toBe(false);
    expect(results).toBe("access 토큰 생성 jwt 환경 변수 확인 필요");
  });

  it("payload, 환경 변수가 유효하면 토큰을 리턴해야한다.", () => {
    const payload = { payload_a: "a" };
    process.env.JWT_ACCESS_SECRET = "some_scret";

    jest.spyOn(jwt, "sign").mockReturnValue("some_access_token");

    const { isCreated, results } = jwtUtils.createAccessToken({ payload });

    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(isCreated).toBe(true);
    expect(results).toBe("some_access_token");
  });

  it("access token 생성에 실패하면 예외를 발생시켜야 한다.", () => {
    const payload = { payload_a: "a" };
    process.env.JWT_ACCESS_SECRET = "some_scret";

    jest.spyOn(jwt, "sign").mockImplementation(() => {
      throw new Error();
    });

    const { isCreated, results } = jwtUtils.createAccessToken({ payload });

    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(isCreated).toBe(false);
    expect(results).toBe("access 토큰 생성 중 오류 발생");
  });
});

describe("createRefreshToken", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  const invalidPayload = ["", [], undefined, null, {}, 123];
  it.each(invalidPayload)("payload가 유효하지 않으면 예외를 발생시켜야 한다.", (payload) => {
    jest.spyOn(jwt, "sign").mockReturnValue();

    const { isCreated, results } = jwtUtils.createRefreshToken({ payload });

    expect(jwt.sign).not.toHaveBeenCalled();
    expect(isCreated).toBe(false);
    expect(results).toBe("payload 확인 필요");
  });

  it("payload가 유효하지만 환경 변수가 유효하지 않으면 예외를 발생시켜야 한다.", () => {
    process.env.JWT_REFRESH_SECRET = "";
    const payload = { payload_a: "a" };

    jest.spyOn(jwt, "sign").mockReturnValue();

    const { isCreated, results } = jwtUtils.createRefreshToken({ payload });

    expect(jwt.sign).not.toHaveBeenCalled();
    expect(isCreated).toBe(false);
    expect(results).toBe("refresh 토큰 생성 jwt 환경 변수 확인 필요");
  });

  it("payload, 환경 변수가 유효하면 토큰을 리턴해야한다.", () => {
    const payload = { payload_a: "a" };
    process.env.JWT_REFRESH_SECRET = "some_scret";

    jest.spyOn(jwt, "sign").mockReturnValue("some_refresh_token");

    const { isCreated, results } = jwtUtils.createAccessToken({ payload });

    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(isCreated).toBe(true);
    expect(results).toBe("some_refresh_token");
  });

  it("refresh token 생성에 실패하면 예외를 발생시켜야 한다.", () => {
    const payload = { payload_a: "a" };
    process.env.JWT_REFRESH_SECRET = "some_scret";

    jest.spyOn(jwt, "sign").mockImplementation(() => {
      throw new Error();
    });

    const { isCreated, results } = jwtUtils.createRefreshToken({ payload });

    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(isCreated).toBe(false);
    expect(results).toBe("refresh 토큰 생성 중 오류 발생");
  });
});

describe("verifyToken", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  const invalidToken = ["", [], undefined, null, {}, 123];
  it.each(invalidToken)("token이 유효하지 않으면 예외를 발생시켜야한다.", (token) => {
    jest.spyOn(jwt, "verify").mockReturnValue();

    const { isValid, results } = jwtUtils.verifyToken({ token });

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(isValid).toBe(false);
    expect(results).toBe("NoTokenError");
  });

  it("access token 디코딩하는 경우 토큰이 유효하지만 환경 변수가 유효하지 않으면 예외를 발생시켜야 한다.", () => {
    process.env.JWT_ACCESS_SECRET = "";
    const token = "some_access_token";

    jest.spyOn(jwt, "verify").mockReturnValue();

    const { isValid, results } = jwtUtils.verifyToken({ token });

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(isValid).toBe(false);
    expect(results).toBe("환경 변수 JWT_ACCESS_SECRET 확인 필요");
  });

  it("access token 디코딩 성공한 경우 디코딩된 값을 리턴해야한다.", () => {
    process.env.JWT_ACCESS_SECRET = "some_scret";
    const token = "some_access_token";

    jest.spyOn(jwt, "verify").mockReturnValue("decoded_access_token");

    const { isValid, results } = jwtUtils.verifyToken({ token });

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(isValid).toBe(true);
    expect(results).toBe("decoded_access_token");
  });

  it("refresh token 디코딩하는 경우 토큰이 유효하지만 환경 변수가 유효하지 않으면 예외를 발생시켜야 한다.", () => {
    process.env.JWT_REFRESH_SECRET = "";
    const token = "some_refresh_token";

    jest.spyOn(jwt, "verify").mockReturnValue();

    const { isValid, results } = jwtUtils.verifyToken({ token, isRefresh: true });

    expect(jwt.verify).not.toHaveBeenCalled();
    expect(isValid).toBe(false);
    expect(results).toBe("환경 변수 JWT_REFRESH_SECRET 확인 필요");
  });

  it("refresh token 디코딩 성공한 경우 디코딩된 값을 리턴해야한다.", () => {
    process.env.JWT_REFRESH_SECRET = "some_scret";
    const token = "some_refresh_token";

    jest.spyOn(jwt, "verify").mockReturnValue("decoded_refresh_token");

    const { isValid, results } = jwtUtils.verifyToken({ token, isRefresh: true });

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(isValid).toBe(true);
    expect(results).toBe("decoded_refresh_token");
  });

  it("토큰이 만료된 경우 예외를 발생시켜야 한다.", () => {
    process.env.JWT_REFRESH_SECRET = "some_scret";
    const token = "some_refresh_token";

    jest.spyOn(jwt, "verify").mockImplementation(() => {
      const error = new Error();
      error.name = "TokenExpiredError";

      throw error;
    });

    const { isValid, results } = jwtUtils.verifyToken({ token });

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(isValid).toBe(false);
    expect(results).toBe("TokenExpiredError");
  });

  it("토큰에 오류가 있는 경우 예외를 발생시켜야 한다.", () => {
    process.env.JWT_REFRESH_SECRET = "some_scret";
    const token = "some_refresh_token";

    jest.spyOn(jwt, "verify").mockImplementation(() => {
      const error = new Error();
      error.name = "JsonWebTokenError";

      throw error;
    });

    const { isValid, results } = jwtUtils.verifyToken({ token });

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(isValid).toBe(false);
    expect(results).toBe("JsonWebTokenError");
  });

  it("토큰 디코딩에 실패하면 예외를 발생시켜야 한다.", () => {
    process.env.JWT_REFRESH_SECRET = "some_scret";
    const token = "some_refresh_token";

    jest.spyOn(jwt, "verify").mockImplementation(() => {
      throw new Error();
    });

    const { isValid, results } = jwtUtils.verifyToken({ token });

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(isValid).toBe(false);
    expect(results).toBe("토큰 디코딩 중 오류 발생");
  });
});
