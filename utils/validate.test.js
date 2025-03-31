const { body, query, param } = require("express-validator");
const { getValidationMethod, createChain } = require("./validate");
const { commonErrorResponse } = require("./customErrorResponse");

jest.mock("./customErrorResponse", () => ({
  commonErrorResponse: jest.fn(),
}));

describe("getValidationMethod", () => {
  it("query를 인수로 사용하면 query 함수를 반환해야한다.", () => {
    expect(getValidationMethod("query")).toBe(query);
  });

  it("body를 인수로 사용하면 body를 함수를 반환해야한다.", () => {
    expect(getValidationMethod("body")).toBe(body);
  });

  it("params를 인수로 사용하면 param을 함수를 반환해야한다.", () => {
    expect(getValidationMethod("params")).toBe(param);
  });

  it("null을 인수로 사용하면 null을 함수를 반환해야한다.", () => {
    expect(getValidationMethod(null)).toBe(null);
  });

  it("undefined를 인수로 사용하면 null을 함수를 반환해야한다.", () => {
    expect(getValidationMethod(undefined)).toBe(null);
  });

  it("숫자를 인수로 사용하면 null을 함수로 반환해야한다.", () => {
    expect(getValidationMethod(1)).toBe(null);
  });
});

describe("createChain", () => {
  it("올바르지 않은 타입을 작성하면 commonErrorResponse가 호출된다.", () => {
    createChain("no type", {});

    expect(commonErrorResponse).toHaveBeenCalledWith(
      500,
      "validate 대상이 올바르지 않습니다. type: no type"
    );
  });

  it("타입을 params로 작성하고 빈 객체를 사용하면 commonErrorResponse가 호출된다.", () => {
    createChain("params", {});

    expect(commonErrorResponse).toHaveBeenCalledWith(500, "validate 객체가 없습니다.");
  });

  it("타입을 params로 작성하고 객체에 필수값이 있으면 미들웨어 함수를 리턴한다.", () => {
    const result = createChain("params", { id: { isRequired: true, defaultValue: null } });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.any(Function));
  });

  it("타입을 params로 작성하고 객체에 필수값이 없으면 미들웨어 함수를 리턴한다.", () => {
    const result = createChain("params", { id: { isRequired: false, defaultValue: null } });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.any(Function));
  });

  it("타입을 body로 작성하고 객체에 필수값이 있으면 미들웨어 함수를 리턴한다.", () => {
    const result = createChain("body", { id: { isRequired: true, defaultValue: null } });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.any(Function));
  });

  it("타입을 body로 작성하고 객체에 필수값이 없으면 미들웨어 함수를 리턴한다.", () => {
    const result = createChain("body", { id: { isRequired: false, defaultValue: null } });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.any(Function));
  });

  it("타입을 query로 작성하고 객체에 필수값이 있으면 미들웨어 함수를 리턴한다.", () => {
    const result = createChain("query", { id: { isRequired: true, defaultValue: null } });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.any(Function));
  });

  it("타입을 query로 작성하고 객체에 필수값이 없으면 미들웨어 함수를 리턴한다.", () => {
    const result = createChain("query", { id: { isRequired: false, defaultValue: null } });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.any(Function));
  });
});
