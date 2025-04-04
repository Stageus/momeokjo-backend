require("dotenv").config();
const controller = require("./controller");
const service = require("./service");
const { commonErrorResponse } = require("../../utils/customErrorResponse");
const pool = require("../../database/db");
const jwt = require("../../utils/jwt");

jest.mock("../../database/db", () => ({
  connect: jest.fn().mockReturnValue({ query: jest.fn(), release: jest.fn() }),
  release: jest.fn(),
}));

jest.mock("../../utils/customErrorResponse", () => ({
  commonErrorResponse: jest.fn(),
}));

jest.mock("./service");
jest.mock("../../utils/jwt");

describe("signUp", () => {
  it("인증되지 않은 사용자일 경우 403 상태코드와 안내 메시지를 리턴해야한다.", async () => {
    const req = { cookies: { email: null }, body: { code: null } };
    const res = {};
    const next = jest.fn();
    const client = jest.fn();

    jwt.verifyToken.mockReturnValue({ isValid: false, results: null });

    await controller.signUp(req, res, next, client);

    const error = commonErrorResponse(403, "인증되지 않은 사용자입니다.");
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

    const error = commonErrorResponse(400, "잘못된 인증번호입니다.");
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

describe("sendEmailVerificationCode", () => {
  it("데이터베이스에 중복된 이메일이 있는 경우 409 상태코드와 안내 메시지를 리턴해야한다.", async () => {
    const req = { body: { email: "test@test.com" } };
    const res = {};
    const next = jest.fn();
    const client = jest.fn();

    service.checkIsExistedEmailFromDb.mockResolvedValue(true);
    service.createVerificationCode.mockImplementation();

    await controller.sendEmailVerificationCode(req, res, next, client);

    const error = commonErrorResponse(409, "이미 회원가입에 사용된 이메일입니다.");
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

    const error = commonErrorResponse(403, "인증되지 않은 사용자입니다.");
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

    const error = commonErrorResponse(400, "잘못된 인증번호입니다.");
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
