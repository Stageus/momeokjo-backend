const errorHandler = require("./errorHandler");

describe("errorHandler", () => {
  it("error 객체에 status와 message가 없는 경우 기본값으로 응답해야한다.", () => {
    const err = {};
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "서버에 오류 발생" });
  });

  it("error 객체에 status와 message가 있는 경우 해당 값으로 응답해야한다.", () => {
    const err = {
      status: 400,
      message: "뭔가 오류 발생",
    };
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(err.status);
    expect(res.json).toHaveBeenCalledWith({ message: err.message });
  });
});
