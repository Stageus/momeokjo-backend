require("dotenv").config();

const {
  accessTokenOptions,
  refreshTokenOptions,
  baseCookieOptions,
} = require("../../config/cookies");
const customErrorResponse = require("../../utils/customErrorResponse");
const pool = require("../../database/db");
const algorithm = require("../../utils/algorithm");
const jwt = require("../../utils/jwt");
const service = require("./service");
const controller = require("./controller");
const { contextsKey } = require("express-validator/lib/base");

jest.mock("../../database/db");

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

    checkIsUserFromDbSpy.mockRestore();
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
  it("인증번호가 유효하지 않은 경우 400 상태코드와 안내 메시지를 리턴해야한다.", async () => {
    const req = {
      emailVerified: {
        email: "test@test.com",
      },
      body: {
        id: "some_id",
        pw: "some_pw",
        nickname: "some_nickname",
        code: 123456,
      },
    };
    const res = {};
    const next = jest.fn();
    const client = pool.connect();

    const verifiyCodeSpy = jest.spyOn(service, "checkVerificationCodeAtDb");
    verifiyCodeSpy.mockResolvedValue(false);

    await controller.signUp(req, res, next, client);

    expect(verifiyCodeSpy).toHaveBeenCalledTimes(1);
    expect(verifiyCodeSpy).toHaveBeenCalledWith(client, req.emailVerified.email, req.body.code);

    const error = customErrorResponse(400, "잘못된 인증번호입니다.");
    expect(next).toHaveBeenCalledWith(error);
  });

  it("회원가입에 성공한 경우 200 상태코드와 쿠키를 삭제하고 안내 메시지를 리턴해야한다.", async () => {
    const req = {
      emailVerified: {
        email: "test@test.com",
      },
      body: {
        id: "some_id",
        pw: "some_pw",
        nickname: "some_nickname",
        code: 123456,
      },
    };
    const res = {
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = pool.connect();

    const verifiyCodeSpy = jest.spyOn(service, "checkVerificationCodeAtDb");
    verifiyCodeSpy.mockResolvedValue(true);

    const createUserSpy = jest.spyOn(service, "createUserAtDb");
    createUserSpy.mockResolvedValue();

    await controller.signUp(req, res, next, client);

    expect(verifiyCodeSpy).toHaveBeenCalledTimes(1);
    expect(verifiyCodeSpy).toHaveBeenCalledWith(client, req.emailVerified.email, req.body.code);

    expect(createUserSpy).toHaveBeenCalledTimes(1);
    expect(createUserSpy).toHaveBeenCalledWith(
      client,
      req.body.id,
      req.body.pw,
      req.body.nickname,
      req.emailVerified.email
    );

    expect(res.clearCookie).toHaveBeenCalledTimes(1);
    expect(res.clearCookie).toHaveBeenCalledWith("emailVerified", baseCookieOptions);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "회원가입 성공" });

    expect(next).not.toHaveBeenCalled();
  });
});

describe("findId", () => {
  it("회원이 없는 경우 상태코드 404와 안내 메시지로 예외를 발생시켜야한다.", async () => {
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
    const client = pool.connect();

    const getUserIdSpy = jest.spyOn(service, "getUserIdFromDb");
    getUserIdSpy.mockResolvedValue({ isUser: false, id: undefined });

    await controller.getUserId(req, res, next, client);

    expect(getUserIdSpy).toHaveBeenCalledTimes(1);
    expect(getUserIdSpy).toHaveBeenCalledWith(client, req.body.email);

    const error = customErrorResponse(400, "계정 없음");
    expect(next).toHaveBeenCalledWith(error);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("회원이 있는경우 상태코드 200과 안내 메시지, id를 응답해야한다.", async () => {
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
    const client = pool.connect();

    const getUserIdSpy = jest.spyOn(service, "getUserIdFromDb");
    const mockUser = { isUser: true, id: "some_id" };
    getUserIdSpy.mockResolvedValue(mockUser);

    await controller.getUserId(req, res, next, client);

    expect(getUserIdSpy).toHaveBeenCalledTimes(1);
    expect(getUserIdSpy).toHaveBeenCalledWith(client, req.body.email);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "아이디 조회 성공", id: mockUser.id });

    expect(next).not.toHaveBeenCalled();
  });
});

describe("createRequestPasswordReset", () => {
  it("회원이 없는 경우 상태코드 404와 안내 메시지로 예외를 발생시켜야한다.", async () => {
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
    const client = pool.connect();

    const checkUserSpy = jest.spyOn(service, "checkUserWithIdAndEmailFromDb");
    checkUserSpy.mockResolvedValue(false);

    await controller.createRequestPasswordReset(req, res, next, client);

    expect(checkUserSpy).toHaveBeenCalledTimes(1);
    expect(checkUserSpy).toHaveBeenCalledWith(client, req.body.id, req.body.email);

    const error = customErrorResponse(400, "계정 없음");
    expect(next).toHaveBeenCalledWith(error);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("회원이 있는 경우 상태코드 200와 쿠키, 안내 메시지를 응답해야한다. ", async () => {
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
    const client = pool.connect();

    const checkUserSpy = jest.spyOn(service, "checkUserWithIdAndEmailFromDb");
    checkUserSpy.mockResolvedValue(true);

    const createAccessTokenSpy = jest.spyOn(jwt, "createAccessToken");
    const mockAccessToken = "new_access_token";
    createAccessTokenSpy.mockReturnValue(mockAccessToken);

    await controller.createRequestPasswordReset(req, res, next, client);

    expect(checkUserSpy).toHaveBeenCalledTimes(1);
    expect(checkUserSpy).toHaveBeenCalledWith(client, req.body.id, req.body.email);

    expect(createAccessTokenSpy).toHaveBeenCalledTimes(1);
    expect(createAccessTokenSpy).toHaveBeenCalledWith(
      { id: req.body.id, email: req.body.email },
      process.env.JWT_ACCESS_EXPIRES_IN
    );

    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.cookie).toHaveBeenCalledWith("pwReset", mockAccessToken, accessTokenOptions);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "요청 처리 성공" });

    expect(next).not.toHaveBeenCalled();
  });
});

describe("resetPassword", () => {
  it("유효하지 않은 이메일과 아이디인 경우 상태코드 404와 안내 메시지로 예외를 발생시켜야한다.", async () => {
    const req = {
      resetPw: {
        id: "invalid_id",
        email: "invalid_email",
      },
      body: {
        pw: "some pw",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = pool.connect();

    const checkUserSpy = jest.spyOn(service, "checkUserWithIdAndEmailFromDb");
    checkUserSpy.mockResolvedValue(false);

    await controller.resetPassword(req, res, next, client);

    expect(checkUserSpy).toHaveBeenCalledTimes(1);
    expect(checkUserSpy).toHaveBeenCalledWith(client, req.resetPw.id, req.resetPw.email);

    const error = customErrorResponse(404, "계정 없음");
    expect(next).toHaveBeenCalledWith(error);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("유효한 이메일과 아이디인 경우 비밀번호를 변경하고 상태코드 200과 안내 메시지를 응답해야한다.", async () => {
    const req = {
      resetPw: {
        id: "some_id",
        email: "some_email",
      },
      body: {
        pw: "some pw",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = pool.connect();

    const checkUserSpy = jest.spyOn(service, "checkUserWithIdAndEmailFromDb");
    checkUserSpy.mockResolvedValue(true);

    const updatePasswordSpy = jest.spyOn(service, "updatePasswordAtDb");
    updatePasswordSpy.mockResolvedValue();

    await controller.resetPassword(req, res, next, client);

    expect(checkUserSpy).toHaveBeenCalledTimes(1);
    expect(checkUserSpy).toHaveBeenCalledWith(client, req.resetPw.id, req.resetPw.email);

    expect(updatePasswordSpy).toHaveBeenCalledTimes(1);
    expect(updatePasswordSpy).toHaveBeenCalledWith(
      client,
      req.resetPw.id,
      req.body.pw,
      req.resetPw.email
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "비밀번호 변경 성공" });

    expect(next).not.toHaveBeenCalled();
  });
});

describe("sendEmailVerificationCode", () => {
  it("데이터베이스에 중복된 이메일이 있는 경우 409 상태코드와 안내 메시지를 리턴해야한다.", async () => {
    const req = { body: { email: "test@test.com" } };
    const res = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = pool.connect();

    const checkSpy = jest.spyOn(service, "checkIsExistedEmailFromDb");
    checkSpy.mockResolvedValue(true);

    const createVerificationCodeSpy = jest.spyOn(service, "createVerificationCode");
    createVerificationCodeSpy.mockImplementation(() => {});

    await controller.sendEmailVerificationCode(req, res, next, client);

    expect(checkSpy).toHaveBeenCalledTimes(1);
    expect(checkSpy).toHaveBeenCalledWith(client, req.body.email);

    const error = customErrorResponse(409, "이미 회원가입에 사용된 이메일입니다.");
    expect(next).toHaveBeenCalledWith(error);

    expect(createVerificationCodeSpy).not.toHaveBeenCalled();
  });

  it("데이터베이스에 중복된 이메일이 없는 경우 인증코드가 생성되고 이메일이 전송되어야한다.", async () => {
    const req = { body: { email: "test@test.com" } };
    const res = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = pool.connect();

    const checkSpy = jest.spyOn(service, "checkIsExistedEmailFromDb");
    checkSpy.mockResolvedValue(false);

    const createVerificationCodeSpy = jest.spyOn(service, "createVerificationCode");
    const mockCode = 123456;
    createVerificationCodeSpy.mockReturnValue(mockCode);

    const saveVerificationCodeSpy = jest.spyOn(service, "saveVerificationCodeAtDb");
    saveVerificationCodeSpy.mockResolvedValue();

    const sendEmailSpy = jest.spyOn(service, "sendEmailVerificationCode");
    sendEmailSpy.mockResolvedValue();

    const createAccessTokenSpy = jest.spyOn(jwt, "createAccessToken");
    const mockAccessToken = "new_access_token";
    createAccessTokenSpy.mockReturnValue(mockAccessToken);

    await controller.sendEmailVerificationCode(req, res, next, client);

    expect(checkSpy).toHaveBeenCalledTimes(1);
    expect(checkSpy).toHaveBeenCalledWith(client, req.body.email);

    expect(createVerificationCodeSpy).toHaveBeenCalledTimes(1);

    expect(saveVerificationCodeSpy).toHaveBeenCalledTimes(1);
    expect(saveVerificationCodeSpy).toHaveBeenCalledWith(client, req.body.email, mockCode);

    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailSpy).toHaveBeenCalledWith(req.body.email, mockCode);

    expect(createAccessTokenSpy).toHaveBeenCalledTimes(1);
    expect(createAccessTokenSpy).toHaveBeenCalledWith(
      { email: req.body.email },
      process.env.JWT_ACCESS_EXPIRES_IN
    );

    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.cookie).toHaveBeenCalledWith("email", mockAccessToken, accessTokenOptions);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "이메일 인증 코드 전송 성공" });

    expect(next).not.toHaveBeenCalled();
  });
});

describe("checkEmailVerificationCode", () => {
  it("인증번호가 유효하지 않은 경우 400 상태코드와 안내 메시지를 리턴해야한다.", async () => {
    const req = { email: { email: "test@test.com" }, body: { code: "123456" } };
    const res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = pool.connect();

    const checkSpy = jest.spyOn(service, "checkVerificationCodeAtDb");
    checkSpy.mockResolvedValue(false);

    await controller.checkEmailVerificationCode(req, res, next, client);

    expect(checkSpy).toHaveBeenCalledTimes(1);
    expect(checkSpy).toHaveBeenCalledWith(client, req.email.email, req.body.code);

    const error = customErrorResponse(400, "잘못된 인증번호입니다.");
    expect(next).toHaveBeenCalledWith(error);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("이메일과 인증번호가 유효한 경우 200 상태코드와 안내 메시지를 리턴해야한다.", async () => {
    const req = { email: { email: "test@test.com" }, body: { code: "123456" } };
    const res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    const client = pool.connect();

    const checkSpy = jest.spyOn(service, "checkVerificationCodeAtDb");
    checkSpy.mockResolvedValue(true);

    await controller.checkEmailVerificationCode(req, res, next, client);

    expect(res.clearCookie).toHaveBeenCalledTimes(1);
    expect(res.clearCookie).toHaveBeenCalledWith("email", baseCookieOptions);

    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(res.cookie).toHaveBeenCalledWith(
      "emailVerified",
      { email: req.email.email },
      accessTokenOptions
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "요청 처리 성공" });

    expect(next).not.toHaveBeenCalled();
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
