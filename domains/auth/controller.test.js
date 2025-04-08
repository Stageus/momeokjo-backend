require("dotenv").config();
const controller = require("./controller");
const service = require("./service");
const customErrorResponse = require("../../utils/customErrorResponse");
const pool = require("../../database/db");
const jwt = require("../../utils/jwt");
const algorithm = require("../../utils/algorithm");
const { accessTokenOptions, refreshTokenOptions } = require("../../config/cookies");

jest.mock("../../database/db");
jest.mock("./service");
jest.mock("../../utils/jwt");
jest.mock("../../utils/algorithm");

describe("signIn", () => {
  it("회원이 아닌 경우 예외를 발생시켜야 한다.", async () => {
    const req = {
      body: {
        id: "some_id",
        pw: "some_pw",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = pool.connect();

    const checkIsUserFromDbSpy = jest.spyOn(service, "checkIsUserFromDb");
    checkIsUserFromDbSpy.mockResolvedValue({ isUser: false, users_idx: 1 });

    await controller.signIn(req, res, next, client);

    expect(checkIsUserFromDbSpy).toHaveBeenCalledTimes(1);
    expect(checkIsUserFromDbSpy).toHaveBeenCalledWith(client, req.body.id, req.body.pw);

    const error = customErrorResponse(404, "계정 없음");
    expect(error).toBeInstanceOf(Error);
    expect(next).toHaveBeenCalledWith(error);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("회원이지만 refresh token 만료되었으면 새 토큰 발급하고 응답해야한다.", async () => {
    const req = {
      body: {
        id: "some_id",
        pw: "some_pw",
      },
    };
    const res = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = pool.connect();

    const checkIsUserFromDbSpy = jest.spyOn(service, "checkIsUserFromDb");
    const mockCheckUser = { isUser: true, users_idx: 1 };
    checkIsUserFromDbSpy.mockResolvedValue(mockCheckUser);

    const checkLocalRefreshTokenFromDbSpy = jest.spyOn(service, "checkLocalRefreshTokenFromDb");
    const mockCheckRefreshToken = {
      isExpired: true,
      refreshToken: "some_token",
    };
    checkLocalRefreshTokenFromDbSpy.mockResolvedValue(mockCheckRefreshToken);

    const createRefreshTokenSpy = jest.spyOn(jwt, "createRefreshToken");
    const mockCreateRefreshToken = "new_refresh_token";
    createRefreshTokenSpy.mockReturnValue(mockCreateRefreshToken);

    const encryptSpy = jest.spyOn(algorithm, "encrypt");
    const mockEncrypt = "some_encrypted_token";
    encryptSpy.mockReturnValue(mockEncrypt);

    const saveNewRefreshTokenAtDbSpy = jest.spyOn(service, "saveNewRefreshTokenAtDb");
    saveNewRefreshTokenAtDbSpy.mockResolvedValue();

    const createAccessTokenSpy = jest.spyOn(jwt, "createAccessToken");
    const mockAccessToken = "new_access_token";
    createAccessTokenSpy.mockReturnValue("new_access_token");

    await controller.signIn(req, res, next, client);

    expect(checkIsUserFromDbSpy).toHaveBeenCalledTimes(1);
    expect(checkIsUserFromDbSpy).toHaveBeenCalledWith(client, req.body.id, req.body.pw);

    expect(checkLocalRefreshTokenFromDbSpy).toHaveBeenCalledTimes(1);
    expect(checkLocalRefreshTokenFromDbSpy).toHaveBeenCalledWith(client, mockCheckUser.users_idx);

    expect(createRefreshTokenSpy).toHaveBeenCalledTimes(1);
    expect(createRefreshTokenSpy).toHaveBeenCalledWith(
      {
        users_idx: mockCheckUser.users_idx,
        provider: "LOCAL",
      },
      process.env.JWT_REFRESH_EXPIRES_IN
    );

    expect(encryptSpy).toHaveBeenCalledTimes(1);
    expect(encryptSpy).toHaveBeenCalledWith(mockCreateRefreshToken);

    expect(saveNewRefreshTokenAtDbSpy).toHaveBeenCalledTimes(1);
    expect(saveNewRefreshTokenAtDbSpy).toHaveBeenCalledWith(
      client,
      mockCheckUser.users_idx,
      mockEncrypt,
      expect.any(Date)
    );

    expect(createAccessTokenSpy).toHaveBeenCalledTimes(1);
    expect(createAccessTokenSpy).toHaveBeenCalledWith(
      {
        users_idx: mockCheckUser.users_idx,
        provider: "LOCAL",
      },
      process.env.JWT_ACCESS_EXPIRES_IN
    );

    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.cookie).toHaveBeenNthCalledWith(
      1,
      "accessToken",
      mockAccessToken,
      accessTokenOptions
    );
    expect(res.cookie).toHaveBeenNthCalledWith(2, "refreshToken", mockEncrypt, refreshTokenOptions);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "요청 처리 성공" });
    expect(next).not.toHaveBeenCalled();
  });

  it("회원이고 refresh token 만료되지 않았으면 해당 토큰으로 응답해야한다.", async () => {
    const req = {
      body: {
        id: "some_id",
        pw: "some_pw",
      },
    };
    const res = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = pool.connect();

    const checkIsUserFromDbSpy = jest.spyOn(service, "checkIsUserFromDb");
    const mockCheckUser = { isUser: true, users_idx: 1 };
    checkIsUserFromDbSpy.mockResolvedValue(mockCheckUser);

    const checkLocalRefreshTokenFromDbSpy = jest.spyOn(service, "checkLocalRefreshTokenFromDb");
    const mockCheckRefreshToken = {
      isExpired: false,
      refreshToken: "some_token",
    };
    checkLocalRefreshTokenFromDbSpy.mockResolvedValue(mockCheckRefreshToken);

    const createRefreshTokenSpy = jest.spyOn(jwt, "createRefreshToken");
    const mockCreateRefreshToken = "new_refresh_token";
    createRefreshTokenSpy.mockReturnValue(mockCreateRefreshToken);

    const encryptSpy = jest.spyOn(algorithm, "encrypt");
    const mockEncrypt = "some_encrypted_token";
    encryptSpy.mockReturnValue(mockEncrypt);

    const saveNewRefreshTokenAtDbSpy = jest.spyOn(service, "saveNewRefreshTokenAtDb");
    saveNewRefreshTokenAtDbSpy.mockResolvedValue();

    const createAccessTokenSpy = jest.spyOn(jwt, "createAccessToken");
    const mockAccessToken = "new_access_token";
    createAccessTokenSpy.mockReturnValue("new_access_token");

    await controller.signIn(req, res, next, client);

    expect(checkIsUserFromDbSpy).toHaveBeenCalledTimes(1);
    expect(checkIsUserFromDbSpy).toHaveBeenCalledWith(client, req.body.id, req.body.pw);

    expect(checkLocalRefreshTokenFromDbSpy).toHaveBeenCalledTimes(1);
    expect(checkLocalRefreshTokenFromDbSpy).toHaveBeenCalledWith(client, mockCheckUser.users_idx);

    expect(createAccessTokenSpy).toHaveBeenCalledTimes(1);
    expect(createAccessTokenSpy).toHaveBeenCalledWith(
      {
        users_idx: mockCheckUser.users_idx,
        provider: "LOCAL",
      },
      process.env.JWT_ACCESS_EXPIRES_IN
    );

    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.cookie).toHaveBeenNthCalledWith(
      1,
      "accessToken",
      mockAccessToken,
      accessTokenOptions
    );
    expect(res.cookie).toHaveBeenNthCalledWith(
      2,
      "refreshToken",
      mockCheckRefreshToken.refreshToken,
      refreshTokenOptions
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "요청 처리 성공" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("signUp", () => {
  it("인증되지 않은 사용자일 경우 403 상태코드와 안내 메시지를 리턴해야한다.", async () => {
    const req = { cookies: { email: null }, body: { id: null, pw: null, nick: null, code: null } };
    const res = {};
    const next = jest.fn();
    const client = jest.fn();

    jwt.verifyToken.mockReturnValue({ isValid: false, results: null });

    await controller.signUp(req, res, next, client);

    expect(jwt.verifyToken).toHaveBeenCalledTimes(1);
    const error = customErrorResponse(403, "인증되지 않은 사용자입니다.");
    expect(next).toHaveBeenCalledWith(error);
    expect(service.checkVerificationCodeAtDb).not.toHaveBeenCalled();
  });

  it("인증번호가 유효하지 않은 경우 400 상태코드와 안내 메시지를 리턴해야한다.", async () => {
    const req = { cookies: { email: null }, body: { code: null } };
    const res = {};
    const next = jest.fn();
    const client = jest.fn();

    jwt.verifyToken.mockReturnValue({ isValid: true, results: { email: "test@test.com" } });
    service.checkVerificationCodeAtDb.mockResolvedValue(false);

    await controller.signUp(req, res, next, client);

    const error = customErrorResponse(400, "잘못된 인증번호입니다.");
    expect(next).toHaveBeenCalledWith(error);
  });

  it("회원가입에 성공한 경우 200 상태코드와 쿠키를 삭제하고 안내 메시지를 리턴해야한다.", async () => {
    const req = { cookies: { email: null }, body: { code: null } };
    const res = {
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = jest.fn();

    jwt.verifyToken.mockReturnValue({ isValid: true, results: { email: "test@test.com" } });
    service.checkVerificationCodeAtDb.mockResolvedValue(true);

    await controller.signUp(req, res, next, client);

    expect(jwt.verifyToken).toHaveBeenCalled();
    expect(service.checkVerificationCodeAtDb).toHaveBeenCalled();
    expect(service.createUserAtDb).toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "회원가입 성공" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("findId", () => {
  it("데이터베이스에 email을 가진 회원이 없는 경우 상태코드 404와 안내 메시지로 예외를 발생시켜야한다.", async () => {
    const req = {
      body: {
        email: "",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = jest.fn();

    service.getUserIdFromDb.mockResolvedValue(undefined);

    await controller.getUserId(req, res, next, client);

    expect(service.getUserIdFromDb).toHaveBeenCalledTimes(1);
    const error = customErrorResponse(400, "계정 없음");
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("데이터베이스에 email을 가진 회원이 있는경우 상태코드 200과 안내 메시지, id를 응답해야한다.", async () => {
    const req = {
      body: {
        email: "test@test.com",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = jest.fn();

    service.getUserIdFromDb.mockResolvedValue("some_id");

    await controller.getUserId(req, res, next, client);

    expect(service.getUserIdFromDb).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "아이디 조회 성공", id: "some_id" });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("createRequestPasswordReset", () => {
  it("데이터베이스에 id와 email을 가진 회원이 없는 경우 상태코드 404와 안내 메시지로 예외를 발생시켜야한다.", async () => {
    const req = {
      body: {
        id: "some_id",
        email: "test@test.com",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = jest.fn();

    service.checkUserWithIdAndEmailFromDb.mockResolvedValue(false);

    await controller.createRequestPasswordReset(req, res, next, client);

    expect(service.checkUserWithIdAndEmailFromDb).toHaveBeenCalledTimes(1);
    const error = customErrorResponse(400, "계정 없음");
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("데이터베이스에 id와 email을 가진 회원이 있는 경우 상태코드 200와 쿠키, 안내 메시지를 응답해야한다. ", async () => {
    const req = {
      body: {
        id: "some_id",
        email: "test@test.com",
      },
    };
    const res = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = jest.fn();

    service.checkUserWithIdAndEmailFromDb.mockResolvedValue(true);
    jwt.createAccessToken.mockReturnValue();

    await controller.createRequestPasswordReset(req, res, next, client);

    expect(service.checkUserWithIdAndEmailFromDb).toHaveBeenCalledTimes(1);
    expect(jwt.createAccessToken).toHaveBeenCalledTimes(1);
    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "요청 처리 성공" });
  });
});

describe("sendEmailVerificationCode", () => {
  it("데이터베이스에 중복된 이메일이 있는 경우 409 상태코드와 안내 메시지를 리턴해야한다.", async () => {
    const req = { body: { email: "test@test.com" } };
    const res = {};
    const next = jest.fn();
    const client = jest.fn();

    service.checkIsExistedEmailFromDb.mockResolvedValue(true);
    service.createVerificationCode.mockImplementation();

    await controller.sendEmailVerificationCode(req, res, next, client);

    const error = customErrorResponse(409, "이미 회원가입에 사용된 이메일입니다.");
    expect(next).toHaveBeenCalledWith(error);
    expect(service.createVerificationCode).not.toHaveBeenCalled();
  });

  it("데이터베이스에 중복된 이메일이 없는 경우 인증코드가 생성되고 이메일이 전송되어야한다.", async () => {
    const req = { body: { email: "test@test.com" } };
    const res = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = jest.fn();

    service.checkIsExistedEmailFromDb.mockResolvedValue(false);
    service.createVerificationCode.mockReturnValue();
    service.saveVerificationCodeAtDb.mockResolvedValue();
    service.sendEmailVerificationCode.mockResolvedValue();
    jwt.createAccessToken.mockResolvedValue();

    await controller.sendEmailVerificationCode(req, res, next, client);

    expect(next).not.toHaveBeenCalled();
    expect(service.createVerificationCode).toHaveBeenCalled();
    expect(service.saveVerificationCodeAtDb).toHaveBeenCalled();
    expect(service.sendEmailVerificationCode).toHaveBeenCalled();
    expect(jwt.createAccessToken).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "이메일 인증 코드 전송 성공" });
  });
});

describe("checkEmailVerificationCode", () => {
  it("인증되지 않은 사용자일 경우 403 상태코드와 안내 메시지를 리턴해야한다.", async () => {
    const req = { cookies: { email: null }, body: { code: null } };
    const res = {};
    const next = jest.fn();
    const client = jest.fn();

    jwt.verifyToken.mockReturnValue({ isValid: false, results: null });

    await controller.checkEmailVerificationCode(req, res, next, client);

    const error = customErrorResponse(403, "인증되지 않은 사용자입니다.");
    expect(next).toHaveBeenCalledWith(error);
    expect(service.checkVerificationCodeAtDb).not.toHaveBeenCalled();
  });

  it("인증번호가 유효하지 않은 경우 400 상태코드와 안내 메시지를 리턴해야한다.", async () => {
    const req = { cookies: { email: null }, body: { code: null } };
    const res = {};
    const next = jest.fn();
    const client = jest.fn();

    jwt.verifyToken.mockReturnValue({ isValid: true, results: { email: "test@test.com" } });
    service.checkVerificationCodeAtDb.mockResolvedValue(false);

    await controller.checkEmailVerificationCode(req, res, next, client);

    const error = customErrorResponse(400, "잘못된 인증번호입니다.");
    expect(next).toHaveBeenCalledWith(error);
  });

  it("이메일과 인증번호가 유효한 경우 200 상태코드와 안내 메시지를 리턴해야한다.", async () => {
    const req = { cookies: { email: null }, body: { code: "123456" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = jest.fn();

    jwt.verifyToken.mockReturnValue({ isValid: true, results: { email: "test@test.com" } });
    service.checkVerificationCodeAtDb.mockResolvedValue(true);

    await controller.checkEmailVerificationCode(req, res, next, client);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "요청 처리 성공" });
  });
});

describe("signInWithKakaoAuth", () => {
  it("카카오 로그인 페이지로 리다이렉트해야 한다", async () => {
    const req = {};
    const res = {
      redirect: jest.fn(),
    };
    const next = jest.fn();
    const client = jest.fn();

    process.env.KAKAO_REST_API_KEY = "test_api_key";
    process.env.KAKAO_REDIRECT_URI = "redirect_url";

    controller.signInWithKakaoAuth(req, res, next, client);

    const expectedUrl = `https://kauth.kakao.com/oauth/authorize?client_id=test_api_key&redirect_uri=redirect_url&response_type=code`;

    expect(res.redirect).toHaveBeenCalledWith(expectedUrl);
  });
});

describe("checkOauthAndRedirect", () => {
  /*
  code from query string
  EjKVmrnoXq8AFazzTTPGvB6BRQnxad4iqZ8zSlU0Zy3Fd12YCKdcTQAAAAQKFxAvAAABlgGDXcmi-KZYUq23DA\
  
  getKakaoToken mockdata
  {
    access_token: 'lHBsWphNsVnxzvOzhCf2kjSHktTey17RAAAAAQoNFN0AAAGWASzeYKj01SImjvGc',
    token_type: 'bearer',
    refresh_token: '3PJtx3oXtBV7M50zPrFwveJvZPdiVIGhAAAAAgoNFN0AAAGWASzeWaj01SImjvGc',
    expires_in: 21599,
    refresh_token_expires_in: 5183999
  }
    getKakaoUserInfo mockdata
  { id: 3932570674, connected_at: '2025-02-22T09:33:38Z' }
  */
  const reqQuery = [{ error: true }, { code: null }];
  it.each(reqQuery)(
    "Oauth Provider로부터 실패 응답을 받으면 상태코드 400과 안내 메시지로 예외를 발생시켜야 한다.",
    async (value) => {
      const req = {
        query: {
          ...value,
        },
      };
      const res = {};
      const next = jest.fn();
      const client = jest.fn();

      await controller.checkOauthAndRedirect(req, res, next, client);

      const error = customErrorResponse(400, "카카오 인증 실패");
      expect(next).toHaveBeenCalledWith(error);
    }
  );

  it("oauth 이력이 없는 회원이면 oauth 정보를 데이터베이스에 저장하고 쿠키와 함께 회원가입 페이지로 리다이렉트를 해야한다.", async () => {
    const req = {
      query: {
        code: "some_code",
      },
    };
    const res = {
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
    const next = jest.fn();
    const client = jest.fn();

    service.getKakaoToken.mockResolvedValue({ accessToken: "", refreshToken: "" });
    service.getKakaoUserInfo.mockResolvedValue({ provider_user_id: "" });
    service.checkOauthUser.mockResolvedValue({ isExistedOauthUser: false, users_idx: undefined });

    algorithm.encrypt.mockResolvedValue();
    service.saveOauthInfoAtDb.mockResolvedValue();

    jwt.createAccessToken.mockResolvedValue();

    await controller.checkOauthAndRedirect(req, res, next, client);

    // expect(next).toHaveBeenCalledWith(expect.any(Error));

    expect(service.getKakaoToken).toHaveBeenCalledTimes(1);
    expect(service.getKakaoUserInfo).toHaveBeenCalledTimes(1);
    expect(service.checkOauthUser).toHaveBeenCalledTimes(1);
    expect(algorithm.encrypt).toHaveBeenCalledTimes(2);
    expect(service.saveOauthInfoAtDb).toHaveBeenCalledTimes(1);
    expect(res.cookie).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalled();

    expect(jwt.createAccessToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("oauth 이력이 있는 회원이면 oauth 정보로 jwt 토큰을 생성하고 쿠키와 함께 음식점 추천 페이지로 리다이렉트를 해야한다.", async () => {
    const req = {
      query: {
        code: "some_code",
      },
    };
    const res = {
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
    const next = jest.fn();
    const client = jest.fn();

    service.getKakaoToken.mockResolvedValue({ accessToken: "", refreshToken: "" });
    service.getKakaoUserInfo.mockResolvedValue({ provider_user_id: "" });
    service.checkOauthUser.mockResolvedValue({ isExistedOauthUser: true, users_idx: "1" });

    jwt.createAccessToken.mockResolvedValue();

    await controller.checkOauthAndRedirect(req, res, next, client);

    expect(service.getKakaoToken).toHaveBeenCalledTimes(1);
    expect(service.getKakaoUserInfo).toHaveBeenCalledTimes(1);
    expect(service.checkOauthUser).toHaveBeenCalledTimes(1);
    expect(jwt.createAccessToken).toHaveBeenCalledTimes(1);
    expect(res.cookie).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
