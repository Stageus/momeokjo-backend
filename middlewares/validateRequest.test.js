const { validateRequest } = require("./validateRequest");
const { validationResult } = require("express-validator");

jest.mock("express-validator");

describe("validateRequest", () => {
  it("유효성 검사에 성공하면 next()를 호출해야한다.", () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });

    validateRequest(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("유효성 검사에 실패하면 404 상태코드와 오류 메시지를 리턴해야한다.", () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [
        {
          path: "email",
          msg: "이메일은 필수입니다.",
          value: "",
          location: "body",
        },
      ],
    });

    validateRequest(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "입력값 확인 필요", target: "email" });
    expect(next).not.toHaveBeenCalled();
  });
});
